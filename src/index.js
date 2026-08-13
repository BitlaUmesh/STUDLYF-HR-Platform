// Entry point proxy for Hostinger Node.js Application Manager (Passenger)
// This delegates server startup directly to the Node.js backend and exports the Express app for Passenger/Hostinger.
const path = require('path');
const app = require(path.resolve(__dirname, '../backend-node/src/index.js'));

module.exports = app;

