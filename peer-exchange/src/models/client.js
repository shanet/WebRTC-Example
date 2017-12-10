function ack(err) {
    if (err) {
        console.log('Error sending message', msg, err);
    }
}

class Client
{
    constructor(conn) {
        this.conn = conn;
    }

    send(data) {
        const msg = JSON.stringify(data);
        this.conn.send(msg, ack);
    }
}

module.exports = {
    ack,
    Client,
};
