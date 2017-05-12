var gulp = require("gulp"),
  pkg = require("./package.json"),
  marigold = require("marigold-build").setup(gulp, pkg),
  js = marigold.js({
    dependencies: ["format"],
    format: "umd"
  }),
  html = marigold.html(["*.pug"]),
  css = marigold.css(["*.styl"]),
  devServer = marigold.devServer([
    "src/**/*",
    "*.pug",
    "*.styl"
  ], [
    "!gulpfile.js",
    "*.js",
    "*.html",
    "*.css"
  ], {
    webSocketServer: require("./server/webSocketServer")({
      mode: "dev"
    }),
    express: require("./server/routes")
  });

marigold.taskify([js, html, css],{
  default: devServer
});
