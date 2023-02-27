let _s = {
  localVideo: undefined,
  localStream: undefined,
  remoteVideo: undefined,
  peerConnection: undefined,
  dataChannel: undefined,
  uuid: undefined,
  serverConnection: undefined,
  statusLog: ''
};

let _dom = {};

const peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

function pageReady() {
  setupDOM();
  showStatus(false);
  addStatus('Page Ready');
  _s.uuid = createUUID();
  _dom.uuid.innerHTML = 'UUID: '+_s.uuid;

  _s.localVideo = _dom.localVideo;
  _s.remoteVideo = _dom.remoteVideo;

  _s.serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
  _s.serverConnection.onmessage = gotMessageFromServer;

  const constraints = {
    video: true,
    audio: true,
  };

  _dom.chatInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      _dom.send.click();
    }
  }); 


  if(navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
  } 
  else {
    alert('Your browser does not support getUserMedia API');
  }
}

function setupDOM(){
  _dom = {
    localVideo: document.getElementById('localVideo'),
    remoteVideo: document.getElementById('remoteVideo'),
    uuid: document.getElementById('uuid'),
    chatInput: document.getElementById('chatInput'),
    statusWrap: document.getElementById('statusWrap'),
    status: document.getElementById('status'),
    chatWrap: document.getElementById('chatWrap'),
    msgArea: document.getElementById('msgArea'),
    send: document.getElementById('send'),
  };
}

function showStatus(show=true){
  _dom.statusWrap.style.display = show ? 'block' : 'none';
}

function showChat(show=true){
  _dom.chatWrap.style.display = show ? 'block' : 'node';
}

function addStatus(msg){
  _s.statusLog = msg + '<br><br>' + _s.statusLog; 
  _dom.status.innerHTML = _s.statusLog;
}

function sendMsg(){
  let content = _dom.chatInput.value;
  const msg = {
    sender: 'Peer',
    content: content
  };
  _s.dataChannel.send(JSON.stringify(msg, null, 2));
  // write local
  content = content.replace(_s.uuid, 'You');
  writeMsg({sender:'You', content});
  _dom.chatInput.value = '';
}

function writeMsg(msg){
  let content = msg.content;
  const origin = msg.sender || 'System';
  content = content.replace(/(?:\r\n|\r|\n)/g, '<br>');
  const out = '<br><strong>' + origin + '</strong>: ' + content + '<br>';
  _dom.msgArea.innerHTML += out;
  _dom.msgArea.scrollTop = msgArea.scrollHeight;
}

function getUserMediaSuccess(stream) {
  _s.localStream = stream;
  _s.localVideo.srcObject = stream;
}

function setupDataChannel(){
  _s.peerConnection.ondatachannel = (event) => {
    event.channel.onmessage = (e) =>{
      const data = JSON.parse(e.data);
      writeMsg(data); 
    };
    event.channel.onerror = (e) =>{
      alert(e);
    }
    event.channel.onopen = (e) =>{
      // The peer channel is open
    };
    event.channel.onclose = (e) =>{
      sendMsg('>> Peer DisconnectedX!');
    }
  };


  _s.dataChannel = _s.peerConnection.createDataChannel('dataChannel');
  _s.dataChannel.onopen = () => {
    // The data channel is now open
    // You can now send data
    const msg = {sender: _s.uuid, content: 'Connected!'};
    _s.dataChannel.send(JSON.stringify(msg, null, 2));
    showChat(true);
  }

  _s.dataChannel.onmessage = (event) => {
    console.log(event);
    alert('GOT MSG');
  }

  _s.dataChannel.onclose = (event) => {
    writeMsg({content: 'Peer Disconnected!'});
  }

}

function start(isCaller) {
  addStatus('Starting');
  _s.peerConnection = new RTCPeerConnection(peerConnectionConfig);
  _s.peerConnection.onicecandidate = gotIceCandidate;
  _s.peerConnection.ontrack = gotRemoteStream;
  _s.peerConnection.addStream(_s.localStream);

  if(isCaller) {
    _s.peerConnection.createOffer().then(createdDescription).catch(errorHandler);
  }
  setupDataChannel();
  writeMsg({content: 'Connected to peer!'});
}

function gotMessageFromServer(message) {
  addStatus('Got Message From Server');
  if(!_s.peerConnection){start(false);}
  const signal = JSON.parse(message.data);
  addStatus('Signal: '+ JSON.stringify(signal, null, 2));
  // Ignore messages from ourself
  if(signal.uuid == _s.uuid){return;}

  if(signal.sdp) {
    _s.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
      // Only create answers in response to offers
      if(signal.sdp.type == 'offer') {
        _s.peerConnection.createAnswer().then(createdDescription)
	  .catch(errorHandler);
      }
    })
    .catch(errorHandler);
  } 
  else if(signal.ice) {
    _s.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice))
      .catch(errorHandler);
  }
}

function gotIceCandidate(event) {
  addStatus('Got Ice Candidate'+JSON.stringify(event, null, 2));
  if(event.candidate != null) {
    addStatus('ICE Event: '+JSON.stringify(event.candidate, null, 2));
    _s.serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': _s.uuid}));
  }
}

function createdDescription(description) {
  addStatus('Got Description');
  addStatus('Description: '+JSON.stringify(description, null, 2));
  console.log('got description');

  _s.peerConnection.setLocalDescription(description).then(function() {
    _s.serverConnection.send(JSON.stringify({'sdp': _s.peerConnection.localDescription, 'uuid': _s.uuid}));
  })
    .catch(errorHandler);
}

function gotRemoteStream(event) {
  addStatus('Got Remote Server');
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
