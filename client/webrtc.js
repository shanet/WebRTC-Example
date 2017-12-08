import { peerConnectionConfig } from './config.js';

var localVideo;
var localStream;
var remoteVideo;
var peerConnection;
var uuid;
var serverConnection;
var dataChannel;

var dataChannelOptions = {
  ordered: false, // do not guarantee order
  maxRetransmitTime: 500, // in milliseconds
};

function pageReady() {
    document.querySelector("button#start")
    .addEventListener("click", start);

    uuid = createUUID();

    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
    serverConnection.addEventListener('message', gotMessageFromServer);

    var constraints = {
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
    localStream = stream;
    localVideo.srcObject = stream;
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);

    peerConnection.addEventListener('icecandidate', gotIceCandidate);
    peerConnection.addEventListener('addstream', gotRemoteStream);
    peerConnection.addStream(localStream);

    peerConnection.addEventListener('datachannel', function(dataChannel) {
        dataChannel.channel.send('Hello there, I got your signal');
    });

    dataChannel = peerConnection.createDataChannel("myLabel", dataChannelOptions);
    dataChannel.addEventListener('error', function (error) {
      console.log("Data Channel Error:", error);
    });

    dataChannel.addEventListener('message', function (event) {
      console.log("Got Data Channel Message:", event.data);
    });

    dataChannel.addEventListener('open', function (event) {
        console.log("Datachannel open", event);
    });

    dataChannel.addEventListener('close', function () {
      console.log("The Data Channel is Closed");
    });

    if(isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
}

function gotMessageFromServer(message) {
    if(!peerConnection) start(false);

    var signal = JSON.parse(message.data);

    // Ignore messages from ourself
    if(signal.uuid == uuid) return;

    if(signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
            // Only create answers in response to offers
            if(signal.sdp.type == 'offer') {
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
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

    peerConnection.setLocalDescription(description).then(function() {
        serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.srcObject = event.stream;
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

pageReady();
