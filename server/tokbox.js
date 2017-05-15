const OpenTok = require("opentok"),
  secrets = require("./data/secrets.json"),
  API_KEY = process.env.OPENTOK_KEY || secrets.openTokKey,
  SECRET = process.env.OPENTOK_SECRET || secrets.openTokSecret;

if(!API_KEY) {
  module.exports = function(){};
}
else {
  const opentok = new OpenTok(API_KEY, SECRET),
    sessions = {};

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

  module.exports = function(appServer) {
    appServer.get(
      "/tokbox/:room/:user",
      (req, res) => {
        let { room, user } = req.params;
        room = decodeURI(room).toLocaleUpperCase();
        user = decodeURI(user).toLocaleUpperCase();
        if(!sessions[room]){
          sessions[room] = getSessionID();
        }
        sessions[room].then((session) =>
          res.json({
            apiKey: API_KEY,
            sessionId: session.sessionId,
            token: session.generateToken({
              data: user
            })
          }));
      });
  };
}
