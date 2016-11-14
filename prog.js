var prog = (function () {
'use strict';

if (!window.DEBUG) {
  console.warn = function () {};
}

function get(file, done) {
  var x = new XMLHttpRequest();
  x.onload = function () {
    return done(x.response);
  };
  x.onprogress = prog.thunk;
  x.open("GET", file);
  x.send();
}

var index = prog = {
  bar: null,
  files: {},
  loaded: 0,
  total: 0,

  thunk: function thunk(evt) {
    var file = evt.target.responseURL || evt.target.currentSrc;
    if (file) {
      if (!prog.files[file]) {
        prog.files[file] = {};
      }
      var f = prog.files[file];
      if (typeof evt.loaded === "number") {
        f.loaded = evt.loaded;
        f.total = evt.total;
      } else {
        var bs = evt.srcElement.buffered;
        var min = Number.MAX_VALUE,
            max = Number.MIN_VALUE;
        for (var i = 0; i < bs.length; ++i) {
          min = Math.min(min, bs.start(i));
          max = Math.max(max, bs.end(i));
        }
        f.loaded = 1000 * max;
        f.total = 1000 * evt.srcElement.duration;
      }
    }

    var total = 0,
        loaded = 0;
    for (var key in prog.files) {
      var _f = prog.files[key];
      loaded += _f.loaded;
      total += _f.total;
    }

    prog.loaded = loaded;
    prog.total = total;

    if (!prog.bar) {
      prog.bar = document.querySelector("progress");
    }

    if (prog.bar && total > 0) {
      prog.bar.max = total;
      prog.bar.value = loaded;
    }
  }
};

var curScripts = document.querySelectorAll("script");
var curScript = curScripts[curScripts.length - 1];

if (curScript && curScript.dataset.app) {
  get(curScript.dataset.app, function (contents) {
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.innerHTML = contents;
    document.body.appendChild(s);
  });
}

return index;

}());
//# sourceMappingURL=prog.js.map
