// routes/elevator.js
const express = require('express');
const router = express.Router();
const elevatorService = require('../services/elevatorService');

router.post('/call', async (req, res) => {
    try {
        const { start_floor, end_floor } = req.body;
        
        if (typeof start_floor !== 'number' || typeof end_floor !== 'number') {
            return res.status(400).json({ error: 'Start and end floors must be numbers.' });
        }
        
        const result = await elevatorService.callElevator(start_floor, end_floor);
        
        if (result.success) {
            res.status(202).json(result);
        } else {
            res.status(400).json({ error: result.message });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.get('/status', async (req, res) => {
    try {
        const { elevator_id } = req.query;
        const status = await elevatorService.getElevatorStatus(elevator_id);
        res.status(200).json(status);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.get('/logs', async (req, res) => {
    try {
        const logs = await require('../db/db').getLogs();
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;