"use strict";
// start the HTTP server
const options = require("./server/options").parse(process.argv),
  fs = require("fs"),
  http = require("http"),
  https = require("https"),
  path = options.path || ".",
  webServer = require("./server/webServer")(path),
  isDev = options.mode === "dev" || process.env.NODE_ENV === "dev",
  keys = isDev && {
    key: maybeGetFile("../primrosevr_com.key"),
    cert: maybeGetFile("../primrosevr_com.crt"),
    ca: maybeGetFile("../CACert.crt")
  },
  isSecure = !!(keys && keys.key && keys.cert);

console.log("Mode is " + options.mode);
console.log("Serving from directory " + path);

function maybeGetFile(file) {
  if (fs.existsSync(file)) {
    return fs.readFileSync(file);
  }
}

if(options.port !== undefined){
  options.port = parseFloat(options.port);
}

const port = options.port || process.env.PORT || (isSecure ? 443 : 80);
console.log("Listening on port " + port);

let appServer = null;
if (isSecure) {
  console.log("starting secure server");
  appServer = https.createServer(keys, webServer);
  appServer.listen(port);
  const portB = port - 443 + 80;
  http.createServer(require("./server/redirector")(port)).listen(portB);
}
else {
  console.log("starting insecure server", keys);
  appServer = http.createServer(webServer)
  appServer.listen(port);
}

// start the WebSocket server
if(!isDev || options.mode !== "localOnly"){
  const webSocketServer = require("./server/webSocketServer"),
  socketio = require("socket.io"),
  io = socketio.listen(appServer);
  io.sockets.on("connection", webSocketServer);
}

// start the browser
if (isDev && options.url) {
  require("./server/starter")(isSecure, port, options.url);
}