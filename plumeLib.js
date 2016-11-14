(function () {
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();















var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

var send = null;

function mangle(name) {
  return "_" + name;
}

function wrap(name) {
  var orig = name;
  while (console[orig]) {
    orig = mangle(orig);
  }
  console[orig] = console[name];
  return function () {
    var args = [];
    for (var i = 0; i < arguments.length; ++i) {
      var elem = arguments[i];
      if ((typeof elem === "undefined" ? "undefined" : _typeof(elem)) === "object" && !(elem instanceof String)) {
        var obj1 = elem,
            obj2 = {};
        for (var key in obj1) {
          obj2[key] = obj1[key];
          if (obj2[key] !== null && obj2[key] !== undefined) {
            obj2[key] = obj2[key].toString();
          }
        }
        args.push(obj2);
      } else if (elem) {
        args.push(elem.toString());
      } else {
        args.push("null");
      }
    }
    var obj = send({
      name: name,
      args: args
    });
    if (obj) {
      console[orig].apply(console, arguments);
    }
  };
}

function onError(message, source, lineno, colno, error) {
  colno = colno || window.event && window.event.errorCharacter;
  var done = false,
      name = "error",
      stack = error && error.stack;

  if (!stack) {
    if (arguments.callee) {
      var head = arguments.callee.caller;
      while (head) {
        stack.push(head.name);
        head = head.caller;
      }
    } else {
      stack = "N/A";
    }
  }

  var data = {
    type: "error",
    time: new Date().toLocaleTimeString(),
    message: message,
    source: source,
    lineno: lineno,
    colno: colno,
    error: error.message,
    stack: stack
  };

  while (!done && console[name]) {
    try {
      console[name](data);
      done = true;
    } catch (exp) {
      name = mangle(name);
    }
  }
}

function setup(type, target, redirects) {
  if (type !== logger.DISABLED) {
    if ((type === logger.HTTP || type === logger.WEBSOCKET) && location.protocol === "file:") {
      console.warn("Can't perform HTTP requests from the file system. Not going to setup the error proxy, but will setup the error catch-all.");
    } else if (type === logger.HTTP) {
      send = function send(data) {
        var req = new XMLHttpRequest();
        req.open("POST", target);
        req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        req.send(JSON.stringify(data));
        return data;
      };
    } else if (type === logger.WEBSOCKET) {
      var socket = new WebSocket(target);
      send = function send(data) {
        socket.send(JSON.stringify(data));
        return data;
      };
    } else if (type === logger.DOM) {
      var output = document.querySelector(target);
      send = function send(data) {
        var elem = document.createElement("pre");
        elem.appendChild(document.createTextNode(JSON.stringify(data)));
        output.appendChild(elem);
        return data;
      };
    } else if (type === logger.USER) {
      if (!(target instanceof Function)) {
        console.warn("The target parameter was expected to be a function, but it was", target);
      } else {
        send = target;
      }
    }

    if (send !== null) {
      redirects = redirects || ["log", "info", "error"];
      redirects.forEach(function (n) {
        console[n] = wrap(n);
      });
    }

    window.addEventListener("error", function (evt) {
      onError(evt.message, evt.filename, evt.lineno, evt.colno, evt.error);
    }, false);
  }
}

logger = {
  setup: setup,
  DISABLED: 0,
  HTTP: 1,
  WEBSOCKET: 2,
  DOM: 3,
  USER: 4
};

WebVRStandardMonitor();

prog.bar.style.height = "10px";

var ctrls = Primrose.DOM.findEverything();
var loginControls = [ctrls.userName, ctrls.connect];
var names = NameGen.compile("!mi");
var protocol = location.protocol.replace("http", "ws");
var serverPath = protocol + "//" + location.hostname;
var roomPattern = /\broom=(\w+)/;
var userPattern = /\buser=(\w+)/;
var defaultRoomName = null;
var defaultUserName = null;
var socket = null;
var session = null;
var publisher = null;
var app = new Primrose.BrowserEnvironment({
  useFog: false,
  useGaze: true,
  quality: Quality.HIGH,
  groundTexture: 0x000000,
  backgroundColor: 0x000000,
  sceneModel: "models/meeting/meetingroom.obj",
  avatarModel: "models/avatar.json",
  font: "fonts/helvetiker_regular.typeface.json",
  disableWebRTC: true,
  progress: prog.thunk
});

ctrls.closeButton.addEventListener("click", hideLoginForm, false);
ctrls.userName.addEventListener("keyup", authenticate, false);
ctrls.connect.addEventListener("click", authenticate, false);
ctrls.randomRoomName.addEventListener("click", setRoomName, false);
ctrls.randomUserName.addEventListener("click", setUserName, false);
ctrls.roomName.addEventListener("change", setRoomName, false);
ctrls.userName.addEventListener("change", setUserName, false);

window.addEventListener("popstate", setRoomName);
app.addEventListener("ready", environmentReady);

setRoomName({ state: {
    roomName: fromField(location.search, roomPattern) || fromField(document.cookie, roomPattern)
  } });

setUserName({ state: {
    userName: fromField(location.search, userPattern) || fromField(document.cookie, userPattern)
  } });

function setRoomName(evt) {
  defaultRoomName = evt && evt.state && evt.state.roomName;
  if (defaultRoomName) {
    evt = evt || true;
    ctrls.roomName.value = defaultRoomName;
  } else if (evt.type === "change") {
    defaultRoomName = ctrls.roomName.value;
  } else {
    defaultRoomName = names.toString();
    ctrls.roomName.placeholder = defaultRoomName + " (random)";
    ctrls.roomName.value = "";
  }
  if (evt && evt.type !== "popstate") {
    history.pushState({ roomName: defaultRoomName }, "Room ID: " + defaultRoomName, "?room=" + defaultRoomName);
  }
}

function setUserName(evt) {
  defaultUserName = evt && evt.state && evt.state.userName;
  if (defaultUserName) {
    ctrls.userName.value = defaultUserName;
  } else if (evt.type === "change") {
    defaultUserName = ctrls.userName.value;
  } else {
    defaultUserName = names.toString();
    ctrls.userName.placeholder = defaultUserName + " (random)";
    ctrls.userName.value = "";
  }
}

function getRoomName() {
  return ctrls.roomName.value || defaultRoomName;
}

function getUserName() {
  return ctrls.userName.value || defaultUserName;
}

function fromField(field, pattern) {
  var spec = field.match(pattern);
  return spec && spec[1];
}

function hideLoginForm(evt) {
  ctrls.loginForm.style.display = "none";
  ctrls.frontBuffer.focus();
}

function showLoginForm() {
  ctrls.loginForm.style.display = "";
  ctrls.userName.focus();
}

function errorMessage(message) {
  ctrls.errorMessage.innerHTML = message;
  ctrls.errorMessage.style.display = "block";
  showLoginForm();
  disableLogin(false);
}

function disableLogin(v) {
  loginControls.forEach(function (ctrl) {
    return ctrl.disabled = v;
  });
  document.body.style.cursor = v ? "wait" : "";
}

function environmentReady() {
  prog.bar.style.display = "none";
  ctrls.loginForm.style.display = "";

  window.addEventListener("vrdisplaypresentchange", function () {
    var currDev = app.input.VR.currentDevice;
    ctrls.controls.style.display = currDev && currDev.isPresenting ? "none" : "";
  });

  app.insertFullScreenButtons("#fullScreenButtonContainer").forEach(function (btn) {
    return btn.className = "primary";
  });
}

function authenticate(evt) {
  if (!evt || evt.type !== "keyup" || evt.keyCode === Primrose.Keys.ENTER) {

    disableLogin(true);

    if (!socket) {
      console.log("connecting to: %s", serverPath);
      socket = io(serverPath);
      socket.on("connect_error", connectionError);
      socket.on("reconnect", authenticate);
      socket.on("loginFailed", authFailed);
      socket.on("loginComplete", authSucceeded);
      socket.on("errorDetail", console.error.bind(console));
    }

    socket.emit("guest", {
      userName: getUserName(),
      appKey: getRoomName()
    });
  }
}

function connectionError(evt) {
  socket.close();
  socket = null;
  app.disconnect();
  authFailed("an error occured while connecting to the server.");
}

function authFailed(reason) {
  errorMessage("We couldn't log you in right now because " + reason.replace(/\[USER\]/g, ctrls.userName.value));
}

function authSucceeded() {
  ctrls.errorMessage.innerHTML = "";
  ctrls.errorMessage.style.display = "none";
  disableLogin(false);
  hideLoginForm();
  var userName = getUserName(),
      roomName = getRoomName();
  document.cookie = "room=" + encodeURI(roomName) + "&user=" + encodeURI(userName);
  app.connect(socket, userName);
  document.title = userName + " in " + roomName;

  Primrose.HTTP.getObject("/tokbox/?room=" + encodeURI(roomName) + "&user=" + encodeURI(userName)).then(function (cred) {
    session = OT.initSession(cred.apiKey, cred.sessionId);
    console.log("session", session);
    session.on("streamCreated", function (evt) {
      var newUserName = evt.stream.connection.data;
      session.subscribe(evt.stream, "tokbox", {
        subscribeToAudio: true,
        subscribeToVideo: false,
        insertMode: "append"
      }, function (err, evt) {
        if (err) {
          console.error("tokbox stream error", error);
        } else {
          var vid = evt.element.querySelector("video");
          console.log(newUserName, vid);
          app.setAudioFromUser(newUserName, vid);
        }
      });
    });

    session.connect(cred.token, function (error) {
      if (error) {
        console.error("tokbox connect error", error);
      } else {
        publisher = OT.initPublisher("tokbox", {
          publishAudio: true,
          publishVideo: false,
          videoSource: null,
          name: userName,
          style: {
            nameDisplay: "off",
            buttonDisplayMode: "off",
            showControls: false
          }
        });
        session.publish(publisher);
      }
    });
  });
}

}());
//# sourceMappingURL=plumeLib.js.map
