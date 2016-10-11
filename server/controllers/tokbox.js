const OpenTok = require("opentok"),
  API_KEY = process.env.OPENTOK_KEY || require("../data/secrets.json").openTokKey,
  opentok = new OpenTok(
    API_KEY,
    process.env.OPENTOK_SECRET || require("../data/secrets.json").openTokSecret),
  Message = require("../Message");

function getSessionID() {
  return new Promise((resolve, reject) => {
    opentok.createSession((error, session) => {
      if (error) {
        reject(error);
      } else {
        resolve(session.sessionId);
      }
    });
  });
}

const defaultSessionPromise = getSessionID();

module.exports = {
  URLPattern: /^\/tokbox\/?$/,
  GET: {
    "*/*": (state) => defaultSessionPromise.then((session) => {
      return {
        apiKey: API_KEY,
        sessionID: session.sessionID,
        token: session.generateToken()
      };
    }).then(Message.json)
  }
};