require("marigold-build/src/starters/server")({
  path: __dirname,
  key: "../primrosevr_com.key",
  cert: "../primrosevr_com.crt",
  certAuthority: "../CACert.crt",
  webSocketServer: require("./server/webSocketServer"),
  express: require("./server/routes")
});
