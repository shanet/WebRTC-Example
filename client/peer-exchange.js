import { createUUID } from './random.js';

export async function createPeerExchange(address) {
    const uuid = createUUID();

    const server = new WebSocket(address);
    const listeners = new Set();

    function onMessage(message) {
        const data = JSON.parse(message.data);

        if (data.uuid === uuid) {
            return;
        }

        listeners.forEach(callback => callback(data, send));
    }

    function listen(callback) {
        listeners.add(callback);
    }

    function send(data) {
        server.send(JSON.stringify(Object.assign({uuid}, data)));
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
