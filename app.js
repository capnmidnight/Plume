require("marigold-build/src/starters/server")({
  webSocketServer: require("./server/webSocketServer")(),
  express: require("./server/routes")
});
