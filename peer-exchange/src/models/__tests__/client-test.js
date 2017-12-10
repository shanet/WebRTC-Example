const {ack, Client} = require('../client.js');

describe('Client', () => {
    it('send messages encoded as JSON to connection', () => {
        const connMock = {
            send: jest.fn(),
        };

        const client = new Client(connMock);
        client.send({my: 'data'});

        expect(connMock.send).toBeCalledWith('{"my":"data"}', ack);
    });
})
