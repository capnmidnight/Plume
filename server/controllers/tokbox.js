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
        resolve(session);
      }
    });
  });
}

const sessions = {};

module.exports = {
  URLPattern: /^\/tokbox\/?\?room=(\w+)&user=(\w+)$/,
  GET: {
    "*/*": (room, user, state) => {
      room = room.toLocaleUpperCase();
      user = user.toLocaleUpperCase();
      if(!sessions[room]){
        sessions[room] = getSessionID();
      }
      return sessions[room].then((session) => {
        return {
          apiKey: API_KEY,
          sessionId: session.sessionId,
          token: session.generateToken({
            data: user
          })
        };
      }).then(Message.json);
    }
  }
};