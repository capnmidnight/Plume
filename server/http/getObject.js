"use strict";
const get = require("./get");
module.exports = (url, options) => get("text/json", url, options);