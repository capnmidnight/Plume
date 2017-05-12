require("marigold-build/src/starters/server")({
  path: ".",
  port: process.env.PORT,
  webSocketServer: require("./server/webSocketServer"),
  express: require("./server/routes")
});
