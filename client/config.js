export const peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ],
};

export const dataChannelConfig = {
  ordered: false, // do not guarantee order
  maxRetransmitTime: 500, // in milliseconds
};
