// db/db.js
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

//The file path for the SQLite database.
const DB_PATH = process.env.DB_PATH || './elevator.db';
let db;

// Wrapper for SQLite methods to use async/await
const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const initializeDb = async () => {
    //The number of elevators in the building.
    const numElevators = parseInt(process.env.NUM_ELEVATORS, 10) || 3;
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            throw err;
        }
    });

    try {
        await dbRun(`
            CREATE TABLE IF NOT EXISTS elevators (
                id INTEGER PRIMARY KEY,
                current_floor INTEGER NOT NULL,
                state TEXT NOT NULL,
                direction TEXT NOT NULL,
                job_queue TEXT NOT NULL
            );
        `);
        await dbRun(`
            CREATE TABLE IF NOT EXISTS event_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                elevator_id INTEGER NOT NULL,
                event_type TEXT NOT NULL,
                details TEXT NOT NULL
            );
        `);
        await dbRun(`
            CREATE TABLE IF NOT EXISTS sql_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                query_text TEXT NOT NULL,
                who TEXT NOT NULL,
                where_from TEXT,
                what TEXT
            );
        `);

        // Check if elevators have already been created
        const elevatorCount = (await dbGet('SELECT COUNT(*) as count FROM elevators')).count;
        if (elevatorCount === 0) {
            for (let i = 1; i <= numElevators; i++) {
                await dbRun(
                    'INSERT INTO elevators (id, current_floor, state, direction, job_queue) VALUES (?, ?, ?, ?, ?)',
                    [i, 1, 'Idle', 'None', '[]']
                );
            }
            console.log(`Initialized ${numElevators} elevators.`);
        } else {
            console.log(`Elevators already exist. Not re-initializing.`);
        }

    } catch (err) {
        console.error('Error setting up database tables:', err.message);
        throw err;
    }
};

const getElevators = async () => {
    await logSql({ query_text: 'SELECT * FROM elevators', who: 'system' });
    return dbAll('SELECT * FROM elevators');
};

const getElevatorById = async (id) => {
    await logSql({ query_text: `SELECT * FROM elevators WHERE id = ${id}`, who: 'system' });
    const row = await dbGet('SELECT * FROM elevators WHERE id = ?', [id]);
    return row ? { ...row, job_queue: JSON.parse(row.job_queue) } : null;
};

const updateElevatorState = async (id, newState) => {
    const elevator = await getElevatorById(id);
    if (!elevator) return;

    const newJobQueue = JSON.stringify(newState.job_queue || elevator.job_queue);

    await dbRun(
        'UPDATE elevators SET current_floor = ?, state = ?, direction = ?, job_queue = ? WHERE id = ?',
        [
            newState.current_floor || elevator.current_floor,
            newState.state || elevator.state,
            newState.direction || elevator.direction,
            newJobQueue,
            id
        ]
    );
    await logEvent(id, 'state_update', {
        state: newState.state,
        direction: newState.direction,
        current_floor: newState.current_floor
    });
};

const logEvent = async (elevator_id, event_type, details) => {
    const detailsString = JSON.stringify(details);
    const id = uuidv4();
    await dbRun(
        'INSERT INTO event_logs (id, timestamp, elevator_id, event_type, details) VALUES (?, ?, ?, ?, ?)',
        [id, new Date().toISOString(), elevator_id, event_type, detailsString]
    );
    console.log(`[Event Log] Elevator ${elevator_id} - ${event_type}:`, details);
};

const logSql = async (logInfo) => {
    const id = uuidv4();
    await dbRun(
        'INSERT INTO sql_logs (id, timestamp, query_text, who, where_from, what) VALUES (?, ?, ?, ?, ?, ?)',
        [id, new Date().toISOString(), logInfo.query_text, logInfo.who, logInfo.where, logInfo.what]
    );
};

// For testing and real-time log access
const getLogs = async () => {
    const eventLogs = await dbAll('SELECT * FROM event_logs');
    const sqlLogs = await dbAll('SELECT * FROM sql_logs');
    return { eventLogs, sqlLogs };
};

module.exports = {
    initializeDb,
    getElevators,
    getElevatorById,
    updateElevatorState,
    logEvent,
    logSql,
    getLogs
};