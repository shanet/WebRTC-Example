var ws_cfg = {
    ssl: true,
    port: 3434,
    ssl_key: '/path/to/your/ssl.key',
    ssl_cert: '/path/to/your/ssl.bundle.crt'
};

var processRequest = function(req, res) {
    console.log("Request received.")
};

var httpServ = require('https');
var fs = require('fs');
var app = null;

app = httpServ.createServer({
  key: fs.readFileSync(ws_cfg.ssl_key),
  cert: fs.readFileSync(ws_cfg.ssl_cert)
}, processRequest).listen(ws_cfg.port);

var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({server: app});

wss.broadcast = function(data) {
    for(var i in this.clients) {
        this.clients[i].send(data);
    }
};

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
        wss.broadcast(message);
    });
});
