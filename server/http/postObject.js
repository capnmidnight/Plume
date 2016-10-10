"use strict";
const post = require("./post");
module.exports = (url, options) => post("text/json", url, options);