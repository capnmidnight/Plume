import Primrose from "primrose/Primrose.modules.js";
import loginForm from "./login-form";

let socket = null,
  session = null,
  publisher = null;

const protocol = location.protocol.replace("http", "ws"),
  serverPath = protocol + "//" + location.host,
  env = new Primrose.BrowserEnvironment({
    useFog: false,
    useGaze: true,
    quality: Primrose.Constants.Quality.HIGH,
    groundModel: "models/meeting/meetingroom.obj",
    backgroundColor: 0x000000,
    avatarModel: "models/avatar.json",
    font: "fonts/helvetiker_regular.typeface.json",
    progress: Preloader,
    fullScreenButtonContainer: "#fullScreenButtonContainer"
  }),

  form = loginForm({
    serverPath,
    env,
    onconnectionerror(evt) {
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
    onauthenticated: function(roomName, userName) {
      env.connect(socket, userName);
      Primrose.HTTP.getObject(`/tokbox/${encodeURI(roomName)}/${encodeURI(userName)}`).then((cred) => {
        session = OT.initSession(cred.apiKey, cred.sessionId);
        console.log("session", session);
        session.on("streamCreated", (evt) => {
          var newUserName = evt.stream.connection.data;
          session.subscribe(evt.stream, "tokbox", {
            subscribeToAudio: true,
            subscribeToVideo: false,
            insertMode: "append"
          }, (err, evt) => {
            if(err){
              console.error("tokbox stream error", error);
            }
            else{
              var vid = evt.element.querySelector("video");
              console.log(newUserName, vid);
              env.setAudioFromUser(newUserName, vid);
            }
          });
        });

        session.connect(cred.token, (error) => {
          if (error) {
            console.error("tokbox connect error", error);
          } else {
            publisher = OT.initPublisher("tokbox", {
              publishAudio: true,
              publishVideo: false,
              videoSource: null,
              name: userName,
              style: {
                nameDisplay: "off",
                buttonDisplayMode: "off",
                showControls: false
              }
            });
            session.publish(publisher);
          }
        });
      });
    }
  });
