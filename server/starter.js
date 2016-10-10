"use strict";
const os = require("os"),
    spawn = require("child_process").spawn,
    defaultStartProc = {
      linux: "xdg-open",
      win32: "explorer",
      darwin: "open"
    }[os.platform()];

module.exports = function (secure, port, startPage, startProc) {
  var defaultPort = secure ? 443 : 80;
  port = port || defaultPort;
  startPage = startPage || "";
  startProc = startProc || defaultStartProc;
  var startUrl = "http";
  if (secure) {
    startUrl += "s";
  }
  startUrl += "://localhost";
  if (port !== defaultPort) {
    startUrl += ":" + port;
  }
  var startPath = startUrl + "/" + startPage;
  console.log("starting: ", startProc, startPath);
  spawn(startProc, [startPath]);
};