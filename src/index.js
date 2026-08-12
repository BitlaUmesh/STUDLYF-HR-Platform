// Entry point proxy for root deployment environments (e.g. Hostinger, Render, Heroku)
// This delegates server startup directly to the Node.js backend.
const path = require('path');
require(path.resolve(__dirname, '../backend-node/src/index.js'));
