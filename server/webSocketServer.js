"use strict";

module.exports = function(options) {

  const User = require("./data/User"),
    activeUsers = {},
    isDev = options && options.mode === "dev" || process.env.NODE_ENV === "dev";

  function broadcast(evt) {
    for (var key in activeUsers) {
      var toUser = activeUsers[key];
      if (toUser.appKey === evt.user.appKey) {
        toUser.emit
          .bind(toUser, (toUser.userName === evt.user.userName) ? evt.skipSocketIndex : -1)
          .apply(toUser, evt.args);
      }
    }
  }

  function peer(evt) {
    var fromUserKey = User.makeID({
        userName: evt.fromUserName,
        appKey: evt.appKey
      }),
      toUserKey = User.makeID({
        userName: evt.toUserName,
        appKey: evt.appKey
      }),
      fromUser = activeUsers[fromUserKey],
      toUser = activeUsers[toUserKey];

    if (fromUser && toUser) {
      var fromIndex = evt.fromUserIndex || 0,
        toIndex = evt.toUserIndex || 0,
        fromSocket = fromUser.devices[fromIndex],
        toSocket = toUser.devices[toIndex];

      if (fromSocket && toSocket) {
        ["offer", "answer", "ice", "cancel"].forEach((evtName) => {
          const thunk = (obj) => {
            toSocket.emit(evtName, obj);
          };
          fromUser.handlers[fromIndex][evtName] = thunk;
          fromSocket.on(evtName, thunk);
        });

        toSocket.emit("peer", evt);
      }
      else{
        console.error("peer error", evt);
      }
    }
  }

  function listUsers(evt){
    if(evt.user){
      var socket = evt.user.devices[evt.index];
      if(socket){
        var userList = [];
        for (var key in activeUsers) {
          var user = activeUsers[key];
          if (user.isConnected &&
            user.appKey === evt.user.appKey &&
            (user.userName !== evt.user.userName || evt.index > 0)) {
            userList.push(user.getPackage());
          }
        }
        socket.emit("userList", userList);
      }
    }
  }

  function setUser(socket, identity, key, user){
    if (!activeUsers[key]) {
      if(user) {
        user.appKey = identity.appKey;
      }
      activeUsers[key] = new User(user || identity);
      activeUsers[key].addEventListener("broadcast", broadcast);
      activeUsers[key].addEventListener("peer", peer);
      activeUsers[key].addEventListener("listUsers", listUsers);
    }

    activeUsers[key].addDevice(socket, identity.appKey);
  }

  function setup(socket, verb, thunk){
    return (identity) => {
      const key = User.makeID(identity);
      if(key){
        identity.appKey = identity.appKey.toLocaleUpperCase();
        identity.userName = identity.userName.toLocaleUpperCase();
        console.log("Trying to %s %s", verb, key);
        thunk(identity, key);
      }
      else {
        socket.emit(verb + "Failed", "no user name/appKey was received at the server.");
        if (isDev) {
          var msg = "have identity: " + !!identity +
            ", userName: " + (identity && identity.userName) +
            ", appKey: " + (identity && identity.appKey) +
            ", key: " + key;
          console.error(msg);
          socket.emit("errorDetail", msg);
        }
      }
    }
  }

  function guestLogin(socket) {
    return setup(socket, "login", (identity, key) => {
      setUser(socket, identity, key);
    });
  }

  return function (socket) {
    console.log("New connection!");

    socket.on("guest", guestLogin(socket));
    socket.on("error", socket.emit.bind(socket, "errorDetail"));
  };
}
