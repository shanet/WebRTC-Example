
let _s = {
  localVideo: undefined,
  localStream: undefined,
  remoteVideo: undefined,
  peerConnection: undefined,
  uuid: undefined,
  serverConnection: undefined
};

const peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

function pageReady() {
  _s.uuid = createUUID();

  _s.localVideo = document.getElementById('localVideo');
  _s.remoteVideo = document.getElementById('remoteVideo');

  _s.serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
  _s.serverConnection.onmessage = gotMessageFromServer;

  const constraints = {
    video: true,
    audio: true,
  };

  if(navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
  } else {
    alert('Your browser does not support getUserMedia API');
  }
}

function getUserMediaSuccess(stream) {
  _s.localStream = stream;
  _s.localVideo.srcObject = stream;
}

function start(isCaller) {
  _s.peerConnection = new RTCPeerConnection(peerConnectionConfig);
  _s.peerConnection.onicecandidate = gotIceCandidate;
  _s.peerConnection.ontrack = gotRemoteStream;
  _s.peerConnection.addStream(_s.localStream);

  if(isCaller) {
    _s.peerConnection.createOffer().then(createdDescription).catch(errorHandler);
  }
}

function gotMessageFromServer(message) {
  if(!_s.peerConnection) start(false);
  const signal = JSON.parse(message.data);

  // Ignore messages from ourself
  if(signal.uuid == _s.uuid) return;

  if(signal.sdp) {
    _s.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
      // Only create answers in response to offers
      if(signal.sdp.type == 'offer') {
        _s.peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
      }
    }).catch(errorHandler);
  } else if(signal.ice) {
    _s.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }
}

function gotIceCandidate(event) {
  if(event.candidate != null) {
    _s.serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': _s.uuid}));
  }
}

function createdDescription(description) {
  console.log('got description');

  _s.peerConnection.setLocalDescription(description).then(function() {
    _s.serverConnection.send(JSON.stringify({'sdp': _s.peerConnection.localDescription, 'uuid': _s.uuid}));
  }).catch(errorHandler);
}

function gotRemoteStream(event) {
  console.log('got remote stream');
  _s.remoteVideo.srcObject = event.streams[0];
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

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
