"use strict";

const Message = require("../Message.js"),
  xirsys = require("../xirsys");

//http://xirsys.com/guide/#

module.exports = {
  URLPattern: /^\/turn\/?$/,
  GET: {
    "*/*": (state) => xirsys.ice().then(Message.json)
  }
};