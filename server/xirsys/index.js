const secure = 1,
  root = "https://service.xirsys.com/",
  domain = "www.primrosevr.com",
  Message = require("../Message"),
  get = require("../http/getObject"),
  post = require("../http/postObject"),
  del = require("../http/delObject");

function req(thunk, path, params){
  params = params || {};
  params.ident = "seanmcbeth";
  params.secret = process.env.XIRSYS_SECRET || require("../data/secrets.json").xirsysSecret;

  if(params.secret) {
    var sep = "?";
    for(var key in params){
      path += sep + key + "=" + params[key];
      sep = "&";
    }

    return thunk(root + path, {
      headers: {
        Accept: "*/*"
      }
    })
      .then((res) => res.body);
  }
  else {
    return Promise.resolve(null);
  }
}

module.exports = {
  signal: {
    token: (application, room) => req(get, "signal/token", {
      domain: domain,
      application: application || "default",
      room: room || "default",
      secure: secure
    }),
    list: () => req(get, "signal/list")
  },
  ice: (application, room) => req(get, "ice", {
    domain: domain,
    application: application || "default",
    room: room || "default",
    secure: secure
  }).then((obj) => obj && obj.d),
  domain: {
    get: () => req(get, "domain"),
    post: (domain) => req(post, "domain", {
      domain: domain
    }),
    del: (domain) => req(del, "domain", {
      domain: domain
    })
  },
  application: {
    get: (domain) => req(get, "application", {
      domain: domain
    }, get),
    post: (domain, application) => req(post, "application", {
      domain: domain,
      application: application
    }),
    del: (domain, application) => req(del, "application", {
      domain: domain,
      application: application
    })
  },
  room: {
    get: (domain, application) => req(get, "room", {
      domain: domain,
      application: application
    }),
    post: (domain, application, room) => req(post, "room", {
      domain: domain,
      application: application,
      room: room
    }),
    del: (domain, application, room) => req(del, "room", {
      domain: domain,
      application: application,
      room: room
    })
  }
};