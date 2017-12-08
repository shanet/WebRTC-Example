function errorHandler(error) {
    console.log(error);
}

export function createPeer(peerExchange, peerConnectionConfig) {
    const conn = new RTCPeerConnection(peerConnectionConfig);

    return conn;
}
