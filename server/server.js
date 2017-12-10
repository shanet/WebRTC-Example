const HTTP_PORT = 8080;


const fs = require('fs');
const http = require('http');
const static = require('node-static');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

const file = new static.Server('./client');

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
    request.addListener('end', () => {
        file.serve(request, response);
    }).resume();
};

var httpServer = http.createServer(handleRequest);
httpServer.listen(HTTP_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpServer});

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        // Broadcast any received message to all clients
        console.log('received: %s', message);
        wss.broadcast(message);
    });
});

wss.broadcast = function(data) {
    this.clients.forEach(function(client) {
        if(client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

console.log('Server running. Visit http://localhost:' + HTTP_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');
