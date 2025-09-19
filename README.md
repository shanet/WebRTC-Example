WebRTC Example
==============

An 'as simple as it gets' WebRTC example.

See [https://ephemeral.cx/2014/09/a-dead-simple-webrtc-example/](https://ephemeral.cx/2014/09/a-dead-simple-webrtc-example/) for a detailed walkthrough of the code.

Note: This repo is kept updated. The general ideas are there, but the above blog post may be somewhat out of date with the code in this repo.

## Usage

If you use `asdf` to manage tool versions a `.tool-versions` file is included in this repo.

The signaling server uses Node.js and `ws` and can be started as such:

```
$ npm install
$ npm start
```

With the server running, open Firefox/Chrome/Safari and visit `https://localhost:8443`.

Please note the following:

* Note the HTTPS! There is no redirect from HTTP to HTTPS.
* You\'ll need to accept the invalid TLS certificate as it is self-signed and WebRTC must be run over TLS.
* Some browsers or OSs may not allow the webcam to be used by multiple pages at once. You may need to use two different browsers or machines.

## Problems?

This is a short example that I don't check often. As such, I rely on users for reports if something breaks. Issues and pull requests are greatly appreciated.

## License

The MIT License (MIT)

Copyright (c) 2014 Kira Tully

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
