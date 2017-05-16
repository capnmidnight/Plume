import Primrose from "primrose/Primrose.modules.js";
import loginForm from "./login-form";

let socket = null,
  session = null,
  env = null;

const protocol = location.protocol.replace("http", "ws"),
  serverPath = protocol + "//" + location.host,

  form = loginForm({

    onnotios() {
      env = new Primrose.BrowserEnvironment({
        useFog: false,
        disableAutoPause: true,
        groundModel: "models/meeting/meetingroom.obj",
        avatarModel: "models/avatar.json",
        font: "fonts/helvetiker_regular.typeface.json",
        progress: Preloader,
        fullScreenButtonContainer: "#fullScreenButtonContainer"
      });

      env.addEventListener("ready", function() {
        form.showLoginForm();
        Array.prototype.forEach.call(document.querySelectorAll("#fullScreenButtonContainer > button"), function(btn) {
          btn.className = "primary";
        });
      });
    },

    onconnectionerror() {
      socket.close();
      socket = null;
      env.disconnect();
    },

    onauthenticate(roomName, userName) {
      if (!socket) {
        console.log("connecting to: %s", serverPath);
        socket = io(serverPath);
        form.setupSocket(socket);
      }

      socket.emit("guest", {
        userName,
        appKey: roomName
      });
    },

    onauthenticated(roomName, userName) {
      env.connect(socket, userName);
      Primrose.HTTP
        .getObject(`/tokbox/${encodeURI(roomName)}/${encodeURI(userName)}`)
        .then((cred) => {
          session = OT.initSession(cred.apiKey, cred.sessionId);
          session.on("streamCreated", (evt) =>
            promisify((handler) =>
              session.subscribe(evt.stream, null, {
                subscribeToAudio: true,
                subscribeToVideo: false,
                insertDefaultUI: false
              }, handler))
              .then((subscriber) =>
                subscriber.once("videoElementCreated", (evt) =>
                  env.setAudioFromUser(
                    subscriber.stream.connection.data,
                    evt.element)))
              .catch((err) =>
                console.error("tokbox stream error", err)));

          return promisify((handler) =>
            session.connect(cred.token, handler));
        })
        .then(() =>
          OT.initPublisher("tokbox", {
            name: userName,
            videoSource: false,
            publishAudio: true,
            publishVideo: false,
            insertMode: "append",
            showControls: false
          }))
        .then((publisher) =>
          promisify((handler) =>
            session.publish(publisher, handler)))
        .catch((err) =>
          console.error("tokbox connect error", err));
    }
  });

export default env;
