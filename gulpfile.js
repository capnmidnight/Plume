var gulp = require("gulp"),
  pkg = require("./package.json"),
  build = require("../notiontheory-basic-build"),
  nt = build.setup(gulp, pkg),
  prog = nt.js("prog", "prog"),
  js = nt.js(pkg.name + "Lib", "src", ["format"]),
  tot = nt.cat(pkg.name, [
    "node_modules/jshashes/hashes.js",
    "node_modules/socket.io-client/socket.io.js",
    "lib/namegen.js",
    "../primrose/Primrose.js",
    pkg.name + "Lib.js"
  ], [js]),
  html = nt.html(pkg.name, ["*.pug"]),
  css = nt.css(pkg.name, ["*.styl"]),
  clean = nt.clean(pkg.name, ["*Lib*.js"], [tot.release]);

gulp.task("format", [js.format]);

gulp.task("default", [
  prog.default,
  js.default,
  tot.default,
  html.default,
  css.default
]);

gulp.task("debug", [
  prog.debug,
  tot.debug,
  html.debug,
  css.debug
]);

gulp.task("test", [
  prog.release,
  tot.release,
  html.test,
  css.release
]);

gulp.task("release", [
  prog.release,
  clean,
  html.release,
  css.release
]);

gulp.task("kablamo", build.exec("npm update && gulp bump && gulp yolo"));