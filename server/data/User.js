"use strict";

class User {
  static makeID(identity){
    return identity
      && identity.userName
      && identity.appKey
      && (identity.appKey.toLocaleUpperCase().trim()
        + ":"
        + identity.userName.toLocaleUpperCase().trim());
  }

  constructor(info) {
    this.devices = [];

    this.handlers = [];

    this.listeners = {
      broadcast: [],
      peer: [],
      listUsers: []
    };

    this.state = [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    this.userName = info.userName;
    this.appKey = null;
  }

  get id() {
    return User.makeID(this);
  }

  addEventListener(evt, thunk) {
    if (this.listeners[evt]) {
      this.listeners[evt].push(thunk);
    }
  }

  fire(evt, args) {
    var list = this.listeners[evt];
    if(list){
      for (var i = 0; i < list.length; ++i){
        var thunk = list[i];
        if(thunk){
          thunk(args);
        }
      }
    }
  }

  peer(evt) {
    evt.appKey = this.appKey;
    this.fire("peer", evt);
  }

  addDevice(socket, appKey) {
    if (this.appKey !== null && this.appKey !== appKey) {
      this.leave();
    }

    //
    // register what app the user is logged into
    //
    this.appKey = appKey;

    //
    // find a slot in which to put the socket
    //
    var index = 0;
    while (index < this.devices.length && this.devices[index]) {
      ++index;
    }

    console.log("Device added for " + this.userName + " at index " + index);
    this.devices[index] = socket;

    //
    // bind the events
    //
    var handlers = {
      chat: this.chat.bind(this),
      peer: this.peer.bind(this),
      userState: this.sync.bind(this, index),
      logout: this.disconnect.bind(this, index),
      disconnect: this.disconnect.bind(this, index),
      listUsers: this.listUsers.bind(this, index),
      getDeviceIndex: socket.emit.bind(socket, "deviceIndex", index),
      offer: null,
      answer: null,
      ice: null,
      cancel: null
    };

    this.handlers[index] = handlers;

    socket.on("userState", handlers.userState);
    socket.on("chat", handlers.chat);
    socket.on("logout", handlers.logout);
    socket.on("disconnect", handlers.disconnect);
    socket.on("peer", handlers.peer);
    socket.on("listUsers", handlers.listUsers);
    socket.on("getDeviceIndex", handlers.getDeviceIndex);

    socket.emit("loginComplete");

    if (index === 0) {
      //
      // notify all of the users of a new user
      //
      this.broadcast(index, "userJoin", this.getPackage());
    }
    else {
      //
      // notify all of the other devices of the new socket.
      //
      this.emit(index, "deviceAdded", index);
      //
      // notify the new socket of all of the other devices.
      //
      for(var i = 0; i < this.devices.length; ++i){
        if(i !== index){
          socket.emit("deviceAdded", i);
        }
      }

      //
      // notify the new socket of its user state.
      //
      socket.emit("userState", this.getPackage());
    }
  }

  sync(index, state) {
    this.state = state;
    this.broadcast(index, "userState", this.getPackage());
  }

  getPackage() {
    return [this.userName].concat(this.state);
  }

  broadcast(skipIndex) {
    var args = Array.prototype.slice.call(arguments, 1),
      evt = {
        user: this,
        skipSocketIndex: skipIndex,
        args: args
      };

    this.fire("broadcast", evt);
  }

  emit(skipIndex) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < this.devices.length; ++i) {
      if (i !== skipIndex && this.devices[i]) {
        this.devices[i].emit.apply(this.devices[i], args);
      }
    }
  }

  get isConnected() {
    var devicesLeft = 0;
    for (var i = 0; i < this.devices.length; ++i) {
      if (this.devices[i]) {
        ++devicesLeft;
      }
    }
    return devicesLeft > 0;
  }

  chat(text) {
    log("[$1]: $2", this.userName, text);
    this.broadcast(-1, "chat", {
      userName: this.userName,
      text: text
    });
  }

  listUsers(index) {
    this.fire("listUsers", {
      user: this,
      index: index
    });
  }

  disconnect(index) {
    const socket = this.devices[index],
      handlers = this.handlers[index];
    this.devices[index] = null;
    this.handlers[index] = null;

    for(let key in handlers){
      if(handlers[key]){
        socket.removeListener(key, handlers[key]);
      }
    }

    if (this.isConnected) {
      console.log(`Device #${index} lost for ${this.userName}.`);
      this.emit(index, "deviceLost", index);
    }
    else {
      console.log(`disconnect = ${this.userName}.`);
      this.leave();
      this.devices.splice(0);
    }
    socket.emit("logoutComplete");
  }

  leave() {
    this.broadcast(-1, "userLeft", this.userName);
  }
}

module.exports = User;