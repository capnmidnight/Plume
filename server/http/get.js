"use strict";
const request = require("./request");
module.exports = (type, url, options) => request("GET", type || "text/plain", url, options);