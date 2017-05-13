require("marigold-build/src/starters/server")({
  path: ".",
  webSocketServer: require("./server/webSocketServer"),
  express: require("./server/routes")
});
