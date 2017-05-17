"use strict";

const crypto = require("crypto"),
  db = require("./db.js"),
  tableName = "users";

db.define(tableName, [
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
  return db.get(tableName, userName, "");
}

function searchUsers(key) {
  return db.search(tableName, key);
}

function setUser(user) {
  return db.set(tableName, user).then(() => user);
}

function deleteUser(obj) {
  return db.delete(tableName, obj.userName, "");
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
