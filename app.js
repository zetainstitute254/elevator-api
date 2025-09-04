// app.js
//Main application file. Sets up the Express server and connects all components.

// Load environment variables from the .env file
require('dotenv').config();
const express = require('express');
const elevatorRoutes = require('./routes/elevator');
const db = require('./db/db');

const app = express();
//The port number on which the Express server will run.
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Initialize the database and then start the server
db.initializeDb().then(() => {
    // Log incoming requests for tracking purposes
    app.use((req, res, next) => {
        const trackingInfo = {
            who: 'API_Client', 
            where: req.ip,
            what: `${req.method} ${req.originalUrl}`
        };

        console.log(`${req.method} ${req.originalUrl}`);

        db.logSql({
            query_text: `Logged API request: ${req.method} ${req.path}`,
            ...trackingInfo
        });
        next();
    });

    app.use('/api/elevator', elevatorRoutes);

    app.listen(PORT, () => {
        console.log(`Elevator API server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});