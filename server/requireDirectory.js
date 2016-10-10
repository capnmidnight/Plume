"use strict";
const fs = require("fs"),
  fileTest = /^[^.].+\.js(on)?$/;

module.exports = function requireDirectory(path) {
  var root = "./server/",
  output = [],
  directories = [path];
  while (directories.length > 0) {
    const dir = directories.shift(),
    files = fs.readdirSync(root + dir);
    files.forEach((file) => {
      const subpath = dir + "/" + file,
      stat = fs.lstatSync(root + subpath);
      if (stat.isDirectory()) {
        directories.push(root + subpath);
      }
      else if (fileTest.test(file)) {
        output.push(require("./" + subpath));
      }
    });
  }
  return output;
};