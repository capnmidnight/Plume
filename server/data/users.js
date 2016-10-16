"use strict";

const crypto = require("crypto"),
  db = require("./db.js");

db.define("users", [
  ["userName", "PartitionKey", "String"]
]);

function makeNewSalt() {
  var bytes = crypto.randomBytes(256);
  var salt = "";
  for (var i = 0; i < bytes.length; ++i) {
    salt += bytes[i].toString(16);
  }
  return salt;
}

function getUser(userName) {
  return db.get("users", userName, "");
}

function searchUsers(key) {
  return db.search("users", key);
}

function setUser(user) {
  return db.set("users", user).then(() => user);
}

function deleteUser(obj) {
  return db.delete("users", obj.userName, "");
}

function deleteAll() {
  searchUsers()
    .then((users) => Promise.all(users.map(deleteUser)))
    .then(() => console.log("all done"));
}

module.exports = {
  get: getUser,
  set: setUser,
  search: searchUsers,
  newSalt: makeNewSalt,
  delete: deleteUser,
  reset: deleteAll
};