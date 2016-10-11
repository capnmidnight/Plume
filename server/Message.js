"use strict";

const options = require("./options").parse(process.argv),
  isDev = options.mode === "dev" || process.env.NODE_ENV === "dev",
  fs = require("fs"),
  http = require("http"),
  mime = require("mime"),
  path = require("path"),
  stream = require("stream"),
  url = require("url"),
  headerTranslation = {
    length: "content-length",
    mime: "content-type"
  };

class Message {
  constructor(httpStatusCode, httpBody, httpHeaders) {
    this.statusCode = httpStatusCode;

    this.headers = {};
    if (httpHeaders !== undefined && httpHeaders !== null) {
      for (var k in httpHeaders) {
        var key = k.toLowerCase();
        key = headerTranslation[key] || key;
        this.headers[key] = httpHeaders[k];
      }
    }

    this.cookies = [];

    if (this.statusCode < 400 && this.headers["connection"] === undefined) {
      this.headers["connection"] = "keep-alive";
    }

    this.body = httpBody;
  }

  cookie(c) {
    this.cookies.push(c);
    return this;
  }

  get body() {
    return this._body;
  }

  set body(httpBody) {

    this._body = httpBody || "";

    if (typeof this._body !== "string" && !(this._body instanceof stream.Readable)) {
      var type = typeof this._body;
      if (type !== "object") {
        this._body = {
          type: type,
          value: this._body
        };
      }
      this._body = JSON.stringify(this._body);
      this.headers["content-type"] = "application/json";
    }

    if (typeof this._body === "string") {
      this.headers["content-length"] = this._body.length;
    }
    else if (this.length === undefined || this.length === null) {
      throw new Error("You must provide a content-length header when using Readable streams for content bodies.");
    }
    else if (this.length > 0 && (this.mime === undefined || this.mime === null)) {
      throw new Error("You must provide a content-type for the responses that have length greater than 0.");
    }
  }

  get length() {
    return this.headers["content-length"];
  }

  get mime() {
    return this.headers["content-type"];
  }

  send(response) {
    if (response.finished) {
      console.trace("Can't send a message over a finished response object.");
    }
    else {

      this.headers["set-cookie"] = this.cookies.map((cookie) => Object.keys(cookie)
        .filter((key) => cookie[key] !== false)
        .map((key) => {
          return cookie[key] === true ? key : key + "=" + cookie[key];
        })
        .join("; "));


      var header = [];
      for (var key in this.headers) {
        var values = this.headers[key];
        if (!(values instanceof Array)) {
          values = [values];
        }
        values.forEach((v) => header.push([key, v]));
      }
      response.writeHead(this.statusCode, header);
      if (this.length === 0) {
        response.end();
      }
      else if (typeof this.body === "string") {
        response.end(this.body);
      }
      else if (this._body instanceof stream.Readable) {
        this.body.pipe(response);
      }
      else {
        // eeeh, what?
        throw new Error("INCONSISTENT STATE!!!");
      }
    }
  }


  static json(obj) {
    return new Message(200, obj, {
      mime: "application/json"
    });
  }

  static text(txt) {
    return new Message(200, txt, {
      mime: "text/plain"
    });
  }

  static html(html) {
    return new Message(200, html, {
      mime: "text/html"
    });
  }

  // this needs to be a method so it can be used to send new cookies.
  static noContent(){
    return new Message(204);
  }

  static directory(dirPath, root){
    var link = function(a, b){
      return "<li><a href=\"" + a + "\">" + b + "</a></li>"
    }

    var files = fs.readdirSync(dirPath),
      links = [],
      parent = path.dirname(dirPath);
    if(parent !== "."){
      links.push(link("..", ".."));
    }
    for(var i = 0; i < files.length; ++i){
      var file = files[i];
      var subPath = path.join(dirPath, file);
      var stats = fs.lstatSync(subPath);
      if(!/^[$.]/.test(file) && (stats.isDirectory() || /\.html$/.test(file))){
        links.push(link(file, file));
      }
    }
    return Message.html("<ul>" + links.join("\n") + "</ul>");
  }

  static file(fileName, state) {
    var checkDate = state.headers["if-modified-since"] && Date.parse(state.headers["if-modified-since"]) || 0;
    return new Promise((resolve, reject) => {
      fs.lstat(fileName, (err, stat) => {
        if (err) {
          resolve(Message.NotFound);
        }
        else if (stat.isDirectory()) {
          var parts = url.parse(state.url);
          parts.pathname += "/";
          resolve(Message.redirect(url.format(parts)));
        }
        else {
          if (isDev) {
            checkDate = 0;
          }

          var modDate = new Date(stat.mtime),
            delta = modDate.getTime() - checkDate;

          if (delta >= 1000 || isDev) {
            var headers = {
              mime: mime.lookup(fileName) || "application/octet-stream",
              length: stat.size
            };

            if(!isDev) {
              headers["last-modified"] = modDate.toGMTString();
            }

            resolve(new Message(200, fs.createReadStream(fileName), headers));
          }
          else {
            resolve(Message.NotModified);
          }
        }
      });
    });
  }

  static redirect(targetURL) {
    return new Message(307, null, {
      "location": targetURL
    });
  }

  static movedPermanently(targetURL){
    return new Message(301, null, {
      "location": targetURL
    });
  }
}

Message.NotModified = new Message(304);
Message.BadRequest = new Message(400);
Message.Unauthorized = new Message(401);
Message.PaymentRequired = new Message(402);
Message.Forbidden = new Message(403);
Message.NotFound = new Message(404, "File not found");
Message.MethodNotAllowed = new Message(405);
Message.NotAcceptable = new Message(406);
Message.ProxyAuthenticationRequired = new Message(407);
Message.RequestTimeout = new Message(408);
Message.Conflict = new Message(409);
Message.Gone = new Message(410);
Message.LengthRequired = new Message(411);
Message.PreconditionFailed = new Message(412);
Message.PayloadTooLarge = new Message(413);
Message.URITooLong = new Message(414);
Message.UnsupportedMediaType = new Message(415);
Message.RangeNotSatisfiable = new Message(416);
Message.ExpectationFailed = new Message(417);
Message.IAmATeapot = new Message(418);
Message.MisdirectedRequest = new Message(421);
Message.UnprocessableEntity = new Message(422);
Message.Locked = new Message(423);
Message.FailedDependency = new Message(424);
Message.UpgradeRequired = new Message(426);
Message.PreconditionRequired = new Message(428);
Message.TooManyRequests = new Message(429);
Message.RequestHeaderFieldsTooLarge = new Message(431);
Message.UnavailableForLegalReasons = new Message(451);

Message.InternalServerError = new Message(500);
Message.NotImplemented = new Message(501);

module.exports = Message;