const {Client} = require('../models/client.js');
const {createConnectionHandler} = require('../handler.js');

describe('createConnectionHandler', () => {
    it('listens to messages', () => {
        const regMock = {
            handleMessage: jest.fn(),
            handleClose: jest.fn(),
        };

        const handler = createConnectionHandler(regMock);

        const connMock = {
            on: jest.fn(),
        };

        handler(connMock);

        expect(connMock.on).toHaveBeenCalledTimes(2);
        expect(connMock.on.mock.calls[0][0]).toBe('message');
        expect(connMock.on.mock.calls[0][1]).toBeInstanceOf(Function);
        expect(connMock.on.mock.calls[1][0]).toBe('close');
        expect(connMock.on.mock.calls[1][1]).toBeInstanceOf(Function);

        const messageCallback = connMock.on.mock.calls[0][1];
        expect(regMock.handleMessage).toHaveBeenCalledTimes(0);
        messageCallback('arbitrary message');
        expect(regMock.handleMessage).toHaveBeenCalledTimes(1);
        expect(regMock.handleMessage.mock.calls[0][0]).toBeInstanceOf(Client);
        expect(regMock.handleMessage.mock.calls[0][0].conn).toBe(connMock);
        expect(regMock.handleMessage.mock.calls[0][1]).toBe('arbitrary message');

        const disconnectCallback = connMock.on.mock.calls[1][1];
        expect(regMock.handleClose).toHaveBeenCalledTimes(0);
        disconnectCallback();
        expect(regMock.handleClose).toHaveBeenCalledTimes(1);
        expect(regMock.handleClose.mock.calls[0][0]).toBeInstanceOf(Client);
        expect(regMock.handleClose.mock.calls[0][0].conn).toBe(connMock);
    });
});
