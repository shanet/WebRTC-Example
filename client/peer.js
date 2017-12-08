import { createUUID } from './random.js';

function errorHandler(error) {
    console.log(error);
}

function filter(uuid) {
    return function filterSignal(callback) {
        return function(signal) {
            if (signal.uuid === uuid) {
                console.log(`${uuid} ours, filtering`);
                return;
            }
            callback(signal);
        }
    }
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
            conn.setRemoteDescription(remoteDesc);

            const localDesc = await conn.createAnswer();
            conn.setLocalDescription(localDesc);

            send({sdp: localDesc});
        }
    });

    return {
        onConnection,
    };
}

export function createGuest(peerExchange, peerConnectionConfig) {
    const {conn, onSignal, send} = createConn(peerExchange, peerConnectionConfig);

    onSignal(async signal => {
        console.log("Guest signal", signal);
        if (signal.sdp && signal.sdp.type === "answer") {
            const remoteDesc = new RTCSessionDescription(signal.sdp);
            await conn.setRemoteDescription(remoteDesc);
        }
    });

    async function connect() {
        const localDesc = await conn.createOffer();
        await conn.setLocalDescription(localDesc);
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

export function createPeer(peerExchange, peerConnectionConfig) {
    const conn = new RTCPeerConnection(peerConnectionConfig);

    conn.addEventListener('icecandidate', event => {
        if(event.candidate != null) {
            peerExchange.send({'ice': event.candidate});
        }
    });

    peerExchange.listen(createPeerExchangeMessageHandler(conn));

    return conn;
}

function createPeerExchangeMessageHandler(conn) {
    return function gotMessageFromServer(signal, send) {
        if(signal.sdp) {
            console.log("SDP", signal.sdp.type);
            conn.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(() => {
                // Only create answers in response to offers
                if(signal.sdp.type == 'offer') {
                    console.log("Creating answer", signal);
                    return conn.createAnswer()
                    .then(desc => {
                        conn.setLocalDescription(desc);
                        send({'sdp': desc})
                    });
                }
            }).catch(errorHandler);
        } else if(signal.ice) {
            conn.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
        }
    };
}
