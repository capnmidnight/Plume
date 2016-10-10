"use strict";
const del = require("./del");
module.exports = (url, options) => del("text/json", url, options);