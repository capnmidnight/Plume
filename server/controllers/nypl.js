"use strict";

const Message = require("../Message.js"),
  getObject = require("../http/getObject");

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