var gulp = require("gulp"),
  pkg = require("./package.json"),
  build = require("notiontheory-basic-build"),
  nt = build.setup(gulp, pkg),
  js = nt.js(pkg.name, "src", ["format"]),
  html = nt.html(pkg.name, ["*.pug"]),
  css = nt.css(pkg.name, ["*.styl"]);

gulp.task("format", [js.format]);

gulp.task("default", [
  js.default,
  html.default,
  css.default
]);

gulp.task("debug", [
  js.debug,
  html.debug,
  css.debug
]);

gulp.task("test", [
  js.release,
  html.test,
  css.release
]);

gulp.task("release", [
  js.release,
  html.release,
  css.release
]);