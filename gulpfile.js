﻿var gulp = require("gulp"),
  pkg = require("./package.json"),
  marigold = require("marigold-build").setup(gulp, pkg),
  js = marigold.js({
    dependencies: ["format"],
    format: "umd",
    moduleName: "env"
  }),
  html = marigold.html(["*.pug"]),
  css = marigold.css(["*.styl"]),
  testNames = ["Sean", "Dave"],
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
    path: ".",
    port: 80,
    mode: null,
    // instances: 2,
    // instance: function(i) {
    //   return "?room=NotionTheory&user=" + testNames[i];
    // },
    key: "../primrosevr_com.key",
    cert: "../primrosevr_com.crt",
    certAuthority: "../CACert.crt",
    webSocketServer: require("./server/webSocketServer")({
      mode: null
    }),
    express: require("./server/routes")
  });

gulp.task("devServer", devServer);

marigold.taskify([js, html, css],{
  default: devServer
});
