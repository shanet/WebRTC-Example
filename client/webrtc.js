import { dataChannelConfig, peerConnectionConfig } from './config.js';
import { createPeerExchange } from './peer-exchange.js';
import { createPeer } from './peer.js';

var peerConnection;
var serverConnection;

function pageReady() {
    document.querySelector("button#start")
    .addEventListener("click", extendOffer);

    serverConnection = createPeerExchange('wss://' + window.location.hostname + ':8443');

    setup();
}

function setup() {
    peerConnection = createPeer(serverConnection, peerConnectionConfig);

    peerConnection.addEventListener('addstream', stream => {
        document.getElementById('remoteVideo').srcObject = event.stream;
    });

    var constraints = {
        video: true,
        audio: true,
    };

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        document.getElementById('localVideo').srcObject = stream;
        peerConnection.addStream(stream);
    });

    peerConnection.addEventListener('datachannel', function(dataChannel) {
        dataChannel.channel.send('Hello there, I got your signal');
    });

    const dataChannel = peerConnection.createDataChannel("myLabel", dataChannelConfig);
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
}

function extendOffer() {
    peerConnection.createOffer().then(createdDescription).catch(errorHandler);
}

function createdDescription(description) {
    console.log('got description');

    peerConnection.setLocalDescription(description).then(function() {
        serverConnection.send({'sdp': peerConnection.localDescription});
    }).catch(errorHandler);
}

function errorHandler(error) {
    console.log(error);
}

pageReady();
