console.log("the port is: "+ process.env.PORT);

require("marigold-build/src/starters/server")({
  path: ".",
  port: process.env.PORT,
  webSocketServer: require("./server/webSocketServer"),
  express: require("./server/routes")
});
