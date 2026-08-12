// Entry point proxy for root deployment environments (e.g. Hostinger, Render, Heroku)
// This delegates server startup directly to the Node.js backend and exports the Express app for Passenger/Hostinger.
const path = require('path');
const app = require(path.resolve(__dirname, '../backend-node/src/index.js'));

module.exports = app;
