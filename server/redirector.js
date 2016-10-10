"use strict";

const Message = require("./Message");

module.exports = (port) => (request, response) => {
	let path = "https://" + request.headers.host;
	if(port !== 443){
		path += ":" + port;
	}
	path += request.url;
	return Message.movedPermanently(path).send(response);
};