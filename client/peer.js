function errorHandler(error) {
    console.log(error);
}

export function createHost(peerExchange, peerConnectionConfig) {
    const listeners = new Set();

    function onConnection(callback) {
        listeners.push(callback);
    }

    function emitConnection(conn) {
        listeners.forEach(callback => callback(conn));
    }

    function handleSDP(sdp) {
        host.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    }

    peerExchange.listen(async (signal, send) => {
        if (signal.sdp && signal.sdp.type === "offer") {
            const host = createConn(peerExchange, peerConnectionConfig);

            const remoteDesc = new RTCSessionDescription(signal.sdp);
            await host.setRemoteDescription(remoteDesc);

            const localDesc = await conn.createAnswer();
            await host.setLocalDescription(localDesc);

            send({'sdp': desc});
        }
    });

    return {
        onConnection,
    };
}

export function createConn(peerExchange, peerConnectionConfig) {
    const conn = new RTCPeerConnection(peerConnectionConfig);

    conn.addEventListener('icecandidate', event => {
        if(event.candidate != null) {
            peerExchange.send({ice: event.candidate});
        }
    });

    peerExchange.listen(signal => {
        if(signal.ice) {
            conn.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
        }
    });

    return conn;
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
