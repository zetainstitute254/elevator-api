
/**
 * @file elevatorService.js
 * @description Handles the core business logic of the elevator system, including movement and state changes.
 */
const db = require('../db/db');
const { v4: uuidv4 } = require('uuid');

//MAX_FLOORS: The maximum number of floors in the building.
//FLOOR_TRAVEL_TIME_MS: The time it takes for an elevator to travel between two floors, in milliseconds.
//DOOR_ACTION_TIME_MS: The time it takes for the elevator doors to open or close, in milliseconds.

const config = {
    FLOOR_TRAVEL_TIME_MS: parseInt(process.env.FLOOR_TRAVEL_TIME_MS, 10) || 5000,
    DOOR_ACTION_TIME_MS: parseInt(process.env.DOOR_ACTION_TIME_MS, 10) || 2000,
    MAX_FLOORS: parseInt(process.env.MAX_FLOORS, 10) || 20
};

/**
 * Finds the closest available idle elevator to a given floor.
 * @param {number} startFloor - The floor where the call was made.
 * @returns {Promise<object|null>} A promise that resolves with the closest idle elevator object or null.
 */
const findClosestIdleElevator = async (startFloor) => {
    const elevators = (await db.getElevators()).filter(e => e.state === 'Idle');
    if (elevators.length === 0) return null;

    let closestElevator = elevators[0];
    let minDistance = Math.abs(elevators[0].current_floor - startFloor);

    for (let i = 1; i < elevators.length; i++) {
        const distance = Math.abs(elevators[i].current_floor - startFloor);
        if (distance < minDistance) {
            minDistance = distance;
            closestElevator = elevators[i];
        }
    }
    return closestElevator;
};

/**
 * Simulates an elevator's movement, updating its state floor by floor.
 * @param {number} elevatorId - The ID of the elevator to move.
 * @param {number} startFloor - The current floor of the elevator.
 * @param {number} endFloor - The destination floor.
 */
const moveElevator = async (elevatorId, startFloor, endFloor, jobId) => {
    const elevator = await db.getElevatorById(elevatorId);
    if (!elevator) return;

    const direction = endFloor > startFloor ? 'Up' : 'Down';
    await db.updateElevatorState(elevatorId, {
        state: 'Moving',
        direction: direction,
        job_queue: [{ start: startFloor, end: endFloor, jobId: jobId }]
    });

    const floorIterator = (currentFloor) => {
        if (currentFloor === endFloor) {
            arriveAtFloor(elevatorId, endFloor);
            return;
        }

        db.updateElevatorState(elevatorId, { current_floor: currentFloor });
        const nextFloor = direction === 'Up' ? currentFloor + 1 : currentFloor - 1;
        
        setTimeout(() => floorIterator(nextFloor), config.FLOOR_TRAVEL_TIME_MS);
    };

    floorIterator(startFloor);
};

/**
 * Handles the elevator's arrival at a floor, including opening and closing doors.
 * @param {number} elevatorId - The ID of the elevator.
 * @param {number} floor - The floor the elevator arrived at.
 */
const arriveAtFloor = async (elevatorId, floor) => {
    await db.updateElevatorState(elevatorId, { state: 'DoorsOpen' });
    await db.logEvent(elevatorId, 'arrival', { current_floor: floor, doors: 'open' });
    
    setTimeout(async () => {
        await db.updateElevatorState(elevatorId, { state: 'Idle', direction: 'None', job_queue: [] });
        await db.logEvent(elevatorId, 'door_close', { current_floor: floor, doors: 'closed' });
    }, config.DOOR_ACTION_TIME_MS);
};

/**
 * Handles an elevator call, finding an available elevator and scheduling its movement.
 * @param {number} startFloor - The floor where the user is.
 * @param {number} endFloor - The user's destination floor.
 * @returns {Promise<object>} A promise that resolves with the status of the elevator dispatch.
 */
const callElevator = async (startFloor, endFloor) => {
    //Check if we have a valid floor.
    if (startFloor === endFloor || startFloor > config.MAX_FLOORS || endFloor > config.MAX_FLOORS) {
        return { success: false, message: "Invalid floor numbers." };
    }

    const elevator = await findClosestIdleElevator(startFloor);
    if (!elevator) {
        return { success: false, message: "No idle elevators available." };
    }
    
    const jobId = uuidv4();
    await db.logEvent(elevator.id, 'call', { start_floor: startFloor, end_floor: endFloor, jobId });

    // Move to start floor
    await moveElevator(elevator.id, elevator.current_floor, startFloor, jobId);
    
    // Schedule move to end floor after first leg is complete
    const timeToArriveAtStart = Math.abs(startFloor - elevator.current_floor) * config.FLOOR_TRAVEL_TIME_MS;
    setTimeout(async () => {
        await moveElevator(elevator.id, startFloor, endFloor, jobId);
    }, timeToArriveAtStart + config.DOOR_ACTION_TIME_MS * 2);

    return {
        success: true,
        jobId,
        message: 'Elevator dispatched.',
        elevator_id: elevator.id,
        status: 'Moving'
    };
};

/**
 * Retrieves the status of one or all elevators.
 * @param {number|string|null} elevatorId - The ID of a specific elevator or null for all.
 * @returns {Promise<Array<object>>} A promise that resolves with an array of elevator status objects.
 */
const getElevatorStatus = async (elevatorId) => {
    if (elevatorId) {
        const elevator = await db.getElevatorById(parseInt(elevatorId));
        return elevator ? [elevator] : [];
    }
    return db.getElevators();
};

module.exports = {
    callElevator,
    getElevatorStatus
};