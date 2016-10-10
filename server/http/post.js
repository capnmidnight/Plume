"use strict";
const request = require("./request");
module.exports = (type, url, options) => request("POST", type, url, options);