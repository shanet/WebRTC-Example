const {Client} = require('./models/client.js');

function createConnectionHandler(registry) {
    return function handleConnection(conn) {
        const client = new Client(conn);

        conn.on('message', message => {
            registry.handleMessage(client, message);
        });

        conn.on('close', () => {
            registry.handleClose(client);
        });
    };
}

module.exports = {
    createConnectionHandler,
};
