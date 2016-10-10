"use strict";
const get = require("./get");
module.exports = (url, options) => get("text/plain", url, options);