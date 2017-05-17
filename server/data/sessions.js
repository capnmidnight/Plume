"use strict";

const db = require("./db.js"),
  createTable = require("./namedTable");

Object.assign(
  module.exports,
  createTable("sessions", "roomName"));
