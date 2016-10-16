var gulp = require("gulp"),
  pkg = require("./package.json"),
  nt = require("notiontheory-basic-build").setup(gulp, pkg, true),
  js = nt.js(pkg.name, "src", ["format"]),
  html = nt.html(pkg.name, ["!node_modules/**/*", "**/*.pug"]),
  css = nt.css(pkg.name, ["!node_modules/**/*", "**/*.styl"]);

gulp.task("format", [js.format]);

gulp.task("default", [
  js.default,
  html.default,
  css.default
]);

gulp.task("debug", [
  js.build,
  html.debug,
  css.build
]);

gulp.task("test", [
  js.build,
  html.test,
  css.build
]);

gulp.task("release", [
  js.build,
  html.release,
  css.build
]);