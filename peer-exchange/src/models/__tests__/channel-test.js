const {Channel} = require('../channel.js');
const {Client} = require('../client.js');

describe('Channel', () => {
    it('when joined by two parties broadcasting sends signal to each except sender', () => {
        const channel = new Channel();
        const client1 = new Client();
        const client2 = new Client();
        client1.send = jest.fn();
        client2.send = jest.fn();
        channel.join(client1);
        channel.join(client2);
        const data = {my: 'data'};
        channel.broadcast(client1, data);
        expect(client1.send).toHaveBeenCalledTimes(0);
        expect(client2.send).toHaveBeenCalledTimes(1);
        expect(client2.send).toHaveBeenLastCalledWith(data);

        const client3 = new Client();
        client3.send = jest.fn();
        channel.join(client3);
        channel.broadcast(client1, data);
        expect(client1.send).toHaveBeenCalledTimes(0);
        expect(client2.send).toHaveBeenCalledTimes(2);
        expect(client3.send).toHaveBeenCalledTimes(1);
        expect(client2.send).toHaveBeenLastCalledWith(data);
        expect(client2.send).toHaveBeenLastCalledWith(data);

        channel.leave(client2);
        channel.broadcast(client3, data);
        expect(client1.send).toHaveBeenCalledTimes(1);
        expect(client1.send).toHaveBeenLastCalledWith(data);
        expect(client3.send).toHaveBeenCalledTimes(1);
    });
});
