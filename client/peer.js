import { createUUID } from './random.js';

function errorHandler(error) {
    console.error(error);
}

export function createHost(peerExchange, peerConnectionConfig) {
    const listeners = new Set();

    function onConnection(callback) {
        listeners.add(callback);
    }

    function emitConnection(conn) {
        listeners.forEach(callback => callback(conn));
    }

    peerExchange.listen(async signal => {
        console.log("Host signal", signal);
        if (signal.sdp && signal.sdp.type === "offer") {
            const {conn, send} = createConn(peerExchange, peerConnectionConfig);

            emitConnection(conn);

            const remoteDesc = new RTCSessionDescription(signal.sdp);
            conn.setRemoteDescription(remoteDesc).catch(errorHandler);

            const localDesc = await conn.createAnswer();
            conn.setLocalDescription(localDesc).catch(errorHandler);

            send({sdp: localDesc});
        }
    });

    return {
        onConnection,
    };
}

export function createGuest(peerExchange, peerConnectionConfig) {
    const {conn, onSignal, send} = createConn(peerExchange, peerConnectionConfig);

    onSignal(signal => {
        console.log("Guest signal", signal);
        if (signal.sdp && signal.sdp.type === "answer") {
            const remoteDesc = new RTCSessionDescription(signal.sdp);
            conn.setRemoteDescription(remoteDesc).catch(errorHandler);
        }
    });

    async function connect() {
        const localDesc = await conn.createOffer();
        conn.setLocalDescription(localDesc).catch(errorHandler);
        send({sdp: localDesc});
    }

    return {
        conn,
        connect,
    };
}


export function createConn(peerExchange, peerConnectionConfig) {
    const conn = new RTCPeerConnection(peerConnectionConfig);
    const uuid = createUUID();

    conn.addEventListener('icecandidate', event => {
        if(event.candidate != null) {
            send({ice: event.candidate});
        }
    });

    const listeners = new Set();

    function onSignal(callback) {
        listeners.add(callback);
    }

    peerExchange.listen(signal => {
        if (signal.uuid === uuid) {
            return;
        }

        listeners.forEach(callback => callback(signal));
    });

    onSignal(signal => {
        if(signal.ice) {
            conn.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
        }
    });

    function send(data) {
        peerExchange.send(Object.assign({}, data, {uuid}));
    }

    return {
        conn,
        onSignal,
        send,
    };
}
