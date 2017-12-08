function errorHandler(error) {
    console.log(error);
}

export function createPeer(peerExchange, peerConnectionConfig) {
    const conn = new RTCPeerConnection(peerConnectionConfig);

    peerExchange.listen(createPeerExchangeMessageHandler(conn));

    return conn;
}

function createPeerExchangeMessageHandler(conn) {
    return function gotMessageFromServer(signal, send) {
        if(signal.sdp) {
            conn.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(() => {
                // Only create answers in response to offers
                if(signal.sdp.type == 'offer') {
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
