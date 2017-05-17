"use strict";

const db = require("./db.js");

module.exports = function(tableName, tableID) {

  db.define(tableName, [
    [tableID, "PartitionKey", "String"]
  ]);

  return {
    get(name) {
      return db.get(tableName, name, "");
    },

    search(key) {
      return db.search(tableName, key);
    },

    set(obj) {
      return db.set(tableName, obj)
        .then(() => room);
    },

    delete(obj) {
      return db.delete(tableName, obj[tableID], "");
    },

    reset() {
      this.search()
        .then((objs) =>
          Promise.all(objs.map((obj) =>
            this.delete(obj))))
        .then(() =>
          console.log("all done"));
    }
  };
};
