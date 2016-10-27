"use strict";

const Message = require("notion-node/src/Message"),
  getObject = require("notion-node/src/http/getObject");

//http://api.repo.nypl.org/

module.exports = {
  URLPattern: /^\/nypl\/?(?:\?(q=[^&]+))?/,
  GET: {
    "*/*": (state) => getObject("http://api.repo.nypl.org/api/v1/items/search?q=stereo&publicDomainOnly=true", {
      headers: {
        Authorization: "Token token=" + process.env.NYPL_TOKEN
      }
    }).then((res) => Message.json(res.body))
  }
};