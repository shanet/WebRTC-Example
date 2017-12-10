const WebSocketServer = require('ws').Server;
const {Registry} = require('./models/registry.js');
const {createConnectionHandler} = require('./handler.js');

const PORT = process.env.PORT || 9000;
const server = new WebSocketServer({port: 9000});

server.on('connection', createConnectionHandler(new Registry()));

console.log(`Running on port ${PORT}`);
