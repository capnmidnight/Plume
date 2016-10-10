"use strict";

const Message = require("../Message.js");

module.exports = {
  URLPattern: /^\/logger\/?$/,
  POST: {
    "*/*": (state) => {
      var body = state.body, 
        func = console[body.name];
      if (func) {
        body.args.unshift(body.name.toLocaleUpperCase() + ":> ");
        func.apply(console, body.args);
      }
      else {
        console.log(body);
      }
      return Message.noContent();
    }
  }
};