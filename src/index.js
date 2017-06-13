import Primrose from "primrose/Primrose.modules.js";
import loginForm from "./login-form";

let socket = null,
  session = null,
  env = null,
  monitor = null;

const protocol = location.protocol.replace("http", "ws"),
  serverPath = protocol + "//" + location.host,
  MF = Primrose.Graphics.ModelFactory,

  form = loginForm({

    async onwebrtcallowed() {
      env = new Primrose.BrowserEnvironment({
        useFog: false,
        disableAutoPause: true,
        groundModel: "models/meeting/meetingroom.obj",
        avatarModel: "models/avatar.json",
        font: "fonts/helvetiker_regular.typeface.json",
        progress: Preloader,
        fullScreenButtonContainer: "#fullScreenButtonContainer"
      });

      env.addEventListener("ready", async function() {
        form.showLoginForm();
        monitor = await MF.loadObject("models/monitor.obj", "obj", Preloader.thunk);
        monitor.addTo(env.scene)
          .at(3.75, 1.2, 0)
          .rot(0, Math.PI, 0);
        Array.prototype.forEach.call(
          document.querySelectorAll("#fullScreenButtonContainer > button"),
          (btn) =>
            btn.className = "primary");
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

    async onauthenticated(roomName, userName) {
      try {
        env.connect(socket, userName);
        const cred = await Primrose.HTTP.getObject(`/tokbox/${encodeURI(roomName)}/${encodeURI(userName)}`);
        session = OT.initSession(cred.apiKey, cred.sessionId);
        session.on("streamCreated", async function(evt){
          try {
            const subscriber = await promisify((handler) =>
              session.subscribe(evt.stream, null, {
                  subscribeToAudio: true,
                  subscribeToVideo: false,
                  insertDefaultUI: false
                }, handler));

            subscriber.once("videoElementCreated", (evt) =>
                env.setAudioFromUser(
                  subscriber.stream.connection.data,
                  evt.element));
          }
          catch(err) {
            console.error("tokbox stream error", err);
          }
        });

        await promisify((handler) => session.connect(cred.token, handler));
        const publisher = OT.initPublisher("tokbox", {
          name: userName,
          videoSource: false,
          publishAudio: true,
          publishVideo: false,
          insertMode: "append",
          showControls: false
        });
        await promisify((handler) => session.publish(publisher, handler));
      }
      catch(err) {
        console.error("tokbox connect error", err);
      }
    }
  });

export default env;
