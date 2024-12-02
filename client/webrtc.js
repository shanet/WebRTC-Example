let localStream;
let localVideo;
let peerConnection;
let remoteVideo;
let serverConnection;
let uuid;
const HTTPS_PORT = process.env.PORT || 8443;

const peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

async function pageReady() {
  uuid = createUUID();

  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');

  serverConnection = new WebSocket(`wss://${window.location.hostname}:${HTTPS_PORT}`);
  serverConnection.onmessage = gotMessageFromServer;

  const constraints = {
    video: true,
    audio: true,
  };

  if(!navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support getUserMedia API');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    localStream = stream;
    localVideo.srcObject = stream;
  } catch(error) {
    errorHandler(error);
  }
}

function start(isCaller) {
  peerConnection = new RTCPeerConnection(peerConnectionConfig);
  peerConnection.onicecandidate = gotIceCandidate;
  peerConnection.ontrack = gotRemoteStream;

  for(const track of localStream.getTracks()) {
    peerConnection.addTrack(track, localStream);
  }

  if(isCaller) {
    peerConnection.createOffer().then(createdDescription).catch(errorHandler);
  }
}

function gotMessageFromServer(message) {
  if(!peerConnection) start(false);

  const signal = JSON.parse(message.data);

  // Ignore messages from ourself
  if(signal.uuid == uuid) return;

  if(signal.sdp) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
      // Only create answers in response to offers
      if(signal.sdp.type !== 'offer') return;

      peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
    }).catch(errorHandler);
  } else if(signal.ice) {
    peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotIceCandidate(event) {
  if(event.candidate != null) {
    serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
  }
}

function createdDescription(description) {
  console.log('got description');

  peerConnection.setLocalDescription(description).then(() => {
    serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  remoteVideo.srcObject = event.streams[0];
}

function errorHandler(error) {
  console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}
