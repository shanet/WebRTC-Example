var dataChannel = new RTCDataChannel();

// Set up an event listener for when a message is received
dataChannel.onmessage = function(event) {
  console.log('Message received: ' + event.data);
};

// Send a message
dataChannel.send('Hello World!');

