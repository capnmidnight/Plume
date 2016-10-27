var gulp = require("gulp"),
  pkg = require("./package.json"),
  build = require("notiontheory-basic-build"),
  nt = build.setup(gulp, pkg),
  pre = nt.js("pre", "pre"),
  js = nt.js(pkg.name + "Lib", "src", ["format"]),
  tot = nt.cat(pkg.name, [
    "../primrose/Primrose.js",
    pkg.name + "Lib.js"
  ], [js]),
  html = nt.html(pkg.name, ["*.pug"]),
  css = nt.css(pkg.name, ["*.styl"]);

gulp.task("format", [js.format]);

gulp.task("default", [
  pre.default,
  js.default,
  html.default,
  css.default
]);

gulp.task("debug", [
  pre.debug,
  tot.debug,
  html.debug,
  css.debug
]);

gulp.task("test", [
  pre.release,
  tot.release,
  html.test,
  css.release
]);

gulp.task("release", [
  pre.release,
  tot.release,
  html.release,
  css.release
]);

gulp.task("kablamo", build.exec("npm update && gulp bump && gulp yolo"));