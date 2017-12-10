export async function createPeerExchange(address) {
    const server = new WebSocket(address);
    const listeners = new Set();

    function onMessage(message) {
        const data = JSON.parse(message.data);
        listeners.forEach(callback => callback(data));
    }

    function listen(callback) {
        listeners.add(callback);
    }

    function send(data) {
        server.send(JSON.stringify(data));
    }

    server.addEventListener('message', onMessage);

    return new Promise(resolve => {
        server.addEventListener('open', () => {
            resolve({
                listen,
                send,
            });
        });
    });
}
