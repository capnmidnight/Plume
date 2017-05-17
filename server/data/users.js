"use strict";

const db = require("./db.js"),
  createTable = require("./namedTable"),
  crypto = require("crypto");

Object.assign(
  module.exports,
  createTable("users", "userName"), {
    newSalt() {
      var bytes = crypto.randomBytes(256);
      var salt = "";
      for (var i = 0; i < bytes.length; ++i) {
        salt += bytes[i].toString(16);
      }
      return salt;
    }
  });
