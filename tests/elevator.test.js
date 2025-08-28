/**
 * @file elevator.test.js
 * @description Unit tests for the elevator API endpoints using Jest and Supertest.
 */
const request = require('supertest');
const express = require('express');
const elevatorRoutes = require('../routes/elevator');
const db = require('../db/db');

// Mock the main application to test routes in isolation
const app = express();
app.use(express.json());
app.use('/api/elevator', elevatorRoutes);

// Mock the entire db module to prevent tests from writing to the actual database
jest.mock('../db/db', () => ({
    initializeDb: jest.fn(), // Mock the async init function
    getElevators: jest.fn(() => Promise.resolve([
        { id: 1, current_floor: 1, state: 'Idle', direction: 'None', job_queue: '[]' },
        { id: 2, current_floor: 10, state: 'Idle', direction: 'None', job_queue: '[]' }
    ])),
    getElevatorById: jest.fn(id => {
        if (id === 1) return Promise.resolve({ id: 1, current_floor: 1, state: 'Idle', direction: 'None', job_queue: '[]' });
        if (id === 2) return Promise.resolve({ id: 2, current_floor: 10, state: 'Idle', direction: 'None', job_queue: '[]' });
        return Promise.resolve(null);
    }),
    updateElevatorState: jest.fn(() => Promise.resolve()),
    logEvent: jest.fn(() => Promise.resolve()),
    logSql: jest.fn(() => Promise.resolve()),
}));

describe('Elevator API Endpoints', () => {
    beforeEach(() => {
        // Clear mock call history before each test to prevent side effects
        jest.clearAllMocks();
    });

    describe('POST /api/elevator/call', () => {
        it('should accept a valid elevator call and return 202', async () => {
            const response = await request(app)
                .post('/api/elevator/call')
                .send({ start_floor: 5, end_floor: 15 });

            expect(response.statusCode).toBe(202);
            expect(response.body).toHaveProperty('jobId');
            expect(response.body.message).toBe('Elevator dispatched.');
            expect(response.body.status).toBe('Moving');
            expect(db.logEvent).toHaveBeenCalledWith(
                expect.any(Number), // The elevator ID
                'call',
                expect.objectContaining({ start_floor: 5, end_floor: 15 })
            );
        });

        it('should return 400 for invalid floor numbers', async () => {
            const response = await request(app)
                .post('/api/elevator/call')
                .send({ start_floor: 'five', end_floor: 10 });
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Start and end floors must be numbers.');
        });
    });

    describe('GET /api/elevator/status', () => {
        it('should return the status of all elevators', async () => {
            const response = await request(app).get('/api/elevator/status');
            
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0]).toHaveProperty('state');
            expect(response.body[1]).toHaveProperty('direction');
        });

        it('should return the status of a single elevator by id', async () => {
            const response = await request(app).get('/api/elevator/status?elevator_id=1');
            
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].id).toBe(1);
        });
    });
});