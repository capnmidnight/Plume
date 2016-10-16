"use strict";

const azure = require("azure-storage"),
  options = require("../options").parse(process.argv),
  isDev = options.mode === "dev" || process.env.NODE_ENV === "dev",
  connectionString = isDev && require("./secrets.json").connectionString || null,
  tables = azure.createTableService(connectionString),
  ent = azure.TableUtilities.entityGenerator,
  meta = {};

function wrap(table, obj) {
  var map = meta[table],
    trans = map.toEntity,
    types = map.types,
    entity = {};
  for (var k in obj) {
    if (obj[k] !== null && obj[k] !== undefined) {
      entity[trans[k] || k] = ent[types[k] || "String"](obj[k]);
    }
  }
  if (entity.RowKey === undefined) {
    entity.RowKey = ent.String("");
  }
  return entity;
}

function unwrap(table, entity) {
  var untrans = meta[table].toObject,
    obj = {};
  for (var k in entity) {
    if (entity[k] !== null && entity[k] !== undefined) {
      var value = entity[k]._,
        key = untrans[k] || k;
      if (key !== "RowKey") {
        obj[key] = value;
      }
    }
  }
  return obj;
}

function promisify(table, thunk) {
  var ready = meta[table].ready;
  if (!ready) {
    throw new Error("Don't know table " + table);
  }
  else {
    return ready.then(() => new Promise((resolve, reject) => thunk((err, state) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(state);
      }
    })));
  }
}

module.exports = {

  define: (table, trans) => {
    var map = meta[table] = {
      toEntity: {},
      toObject: {},
      types: {},
      ready: new Promise((resolve, reject) =>
        tables.createTableIfNotExists(table,
          (err, state) => err && reject(err) || resolve(state)))
    };

    for (var i = 0; i < trans.length; ++i) {
      var def = trans[i],
        objProperty = def[0],
        entProperty = def[1],
        type = def[2];

      map.toEntity[objProperty] = entProperty;
      map.toObject[entProperty] = objProperty;
      map.types[objProperty] = type;
    }

    return map.ready.catch((exp)=>{
      console.error("Error setting up the database connection.", exp.message || exp);
      throw exp;
    });
  },

  ready: (table) => meta[table] && meta[table].ready,

  set: (table, obj) => promisify(table, (callback) => tables.insertOrMergeEntity(table, wrap(table, obj), callback)),

  get: (table, partitionKey, rowKey) => promisify(table, (callback) =>
    tables.retrieveEntity(table, partitionKey, rowKey, callback))
    .then((entity) => unwrap(table, entity)),

  delete: (table, partitionKey, rowKey) => promisify(table, (callback) => {
    var task = {
      PartitionKey: ent.String(partitionKey),
      RowKey: ent.String(rowKey)
    };
    return tables.deleteEntity(table, task, callback);
  }),

  search: (table, partitionKey, rowKey) => promisify(table, (callback) => {
    var query = new azure.TableQuery(),
      m = "where";
    if (partitionKey) {
      query = query.where("PartitionKey eq ?", partitionKey);
      m = "and";
    }
    if (rowKey) {
      query = query[m]("RowKey eq ?", rowKey);
    }
    return tables.queryEntities(table, query, null, callback);
  }).then((entities) => entities.entries.map((entity) => unwrap(table, entity)))
};