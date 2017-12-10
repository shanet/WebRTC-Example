const {Registry} = require('../registry.js');
const {Client} = require('../client.js');

describe('Registry', () => {
    it('broadcasts message to everyone with same id', () => {
        const reg = new Registry();
        const client1 = new Client();
        const client2 = new Client();

        client1.send = jest.fn();
        client2.send = jest.fn();

        reg.handleMessage(client1, JSON.stringify({channelId: 'x', type: "greet"}));
        reg.handleMessage(client2, JSON.stringify({channelId: 'x', type: "offer"}));

        expect(client1.send).toHaveBeenCalledTimes(1);
        expect(client1.send).lastCalledWith({"channelId": "x", "type": "offer"});
        expect(client2.send).toHaveBeenCalledTimes(0);
    });

    it('cleans up when leaving', () => {
        const reg = new Registry();
        const client = new Client();

        reg.handleMessage(client, JSON.stringify({channelId: 'x'}));
        reg.handleDisconnect(client);

        expect(reg.channels.size).toBe(0);
    });
});
