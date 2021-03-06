import Primrose from "primrose/Primrose.modules.js";
import NameGen from "../lib/namegen";

export default function loginForm(options) {

  function setRoomName(evt) {
    defaultRoomName = evt && evt.state && evt.state.roomName;
    if(defaultRoomName){
      evt = evt || true;
      ctrls.roomName.value = defaultRoomName;
    }
    else if(evt.type === "change"){
      defaultRoomName = ctrls.roomName.value;
    }
    else {
      defaultRoomName = names.toString();
      ctrls.roomName.placeholder = defaultRoomName + " (random)";
      ctrls.roomName.value = "";
    }
    if(evt && evt.type !== "popstate"){
      history.pushState({ roomName: defaultRoomName }, "Room ID: " + defaultRoomName, "?room=" + defaultRoomName);
    }
  }

  function setUserName(evt) {
    defaultUserName = evt && evt.state && evt.state.userName;
    if(defaultUserName){
      ctrls.userName.value = defaultUserName;
    }
    else if(evt.type === "change"){
      defaultUserName = ctrls.userName.value;
    }
    else{
      defaultUserName = names.toString();
      ctrls.userName.placeholder = defaultUserName + " (random)";
      ctrls.userName.value = "";
    }
  }

  function getRoomName() {
    return ctrls.roomName.value || defaultRoomName;
  }

  function getUserName() {
    return ctrls.userName.value || defaultUserName;
  }

  function fromField(field, pattern) {
    var spec = field.match(pattern);
    return spec && spec[1];
  }

  function hideLoginForm(evt) {
    ctrls.loginForm.style.display = "none";
    ctrls.frontBuffer.focus();
  }

  function showLoginForm() {
    ctrls.loginForm.style.display = "";
    ctrls.userName.focus();
  }

  function loginError(message) {
    ctrls.loginError.innerHTML = message;
    ctrls.loginError.style.display = "block";
    showLoginForm();
    disableLogin(false);
  }

  function disableLogin(v) {
    loginControls.forEach((ctrl) => ctrl.disabled = v);
    document.body.style.cursor = v ? "wait" : "";
  }

  function authenticate(evt) {
    if (!evt || evt.type !== "keyup" || evt.keyCode === Primrose.Keys.ENTER) {

      disableLogin(true);

      options.onauthenticate(getRoomName(), getUserName());
    }
  }

  function authFailed(reason) {
    loginError("We couldn't log you in right now because " + reason.replace(/\[USER\]/g, ctrls.userName.value));
  }

  function authSucceeded() {
    ctrls.loginError.innerHTML = "";
    ctrls.loginError.style.display = "none";
    disableLogin(false);
    hideLoginForm();
    const userName = getUserName(),
        roomName = getRoomName();

    document.cookie = "room=" + encodeURI(roomName) + "&user=" + encodeURI(userName);
    document.title = userName + " in " + roomName;

    options.onauthenticated(roomName, userName);
  }

  function connectionError(evt){
    options.onconnectionerror(evt);
    authFailed("an error occured while connecting to the server.");
  }

  const ctrls = Primrose.DOM.findEverything(),
    loginControls = [
      ctrls.userName,
      ctrls.connect
    ],
    names = NameGen.compile("!mi"),
    roomPattern = /\broom=(\w+)/,
    userPattern = /\buser=(\w+)/;

  let defaultRoomName = null,
    defaultUserName = null;

  if(isiOS && !/\bOS 11_/.test(navigator.userAgent)) {
    ctrls.iOSMessage.style.display = "";
  }
  else {
    options.onwebrtcallowed();

    ctrls.closeButton.addEventListener("click", hideLoginForm, false);
    ctrls.userName.addEventListener("keyup", authenticate, false);
    ctrls.connect.addEventListener("click", authenticate, false);
    ctrls.randomRoomName.addEventListener("click", setRoomName, false);
    ctrls.randomUserName.addEventListener("click", setUserName, false);
    ctrls.roomName.addEventListener("change", setRoomName, false);
    ctrls.userName.addEventListener("change", setUserName, false);

    window.addEventListener("popstate", setRoomName);

    const queryString = location.search;

    setRoomName({ state: {
      roomName: fromField(queryString, roomPattern) || fromField(document.cookie, roomPattern)
    }});

    setUserName({ state: {
      userName: fromField(queryString, userPattern) || fromField(document.cookie, userPattern)
    }});

    Object.assign(ctrls, {
      setupSocket(socket) {
        socket.on("connect_error", connectionError);
        socket.on("reconnect", authenticate);
        socket.on("loginFailed", authFailed);
        socket.on("loginComplete", authSucceeded);
        socket.on("errorDetail", console.error.bind(console));
      },

      showLoginForm
    });
  }

  return ctrls;
};
