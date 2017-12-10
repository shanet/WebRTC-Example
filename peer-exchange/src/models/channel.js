class Channel
{
    constructor() {
        this.clients = new Set();
    }

    broadcast(originClient, data) {
        [...this.clients]
            .filter(candidateClient => candidateClient !== originClient)
            .forEach(targetClient => targetClient.send(data));
    }

    join(client) {
        this.clients.add(client);
    }

    leave(client) {
        this.clients.delete(client);
    }
}

module.exports = {
    Channel,
};
