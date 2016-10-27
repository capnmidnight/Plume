require("notion-node")(
  "./server/controllers",
  "../primrosevr_com.key",
  "../primrosevr_com.crt",
  "../CACert.crt",
  require("./server/webSocketServer")
);