"use strict";
const request = require("./request");
module.exports = (type, url, options) => request("DELETE", type, url, options);