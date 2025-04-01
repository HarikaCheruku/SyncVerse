const USER_CONNECTION_STATUS = {
    OFFLINE: "offline",
    ONLINE: "online",
  };
  
  const defaultUser = {
    username: "",
    roomId: "",
    status: USER_CONNECTION_STATUS.ONLINE,
    cursorPosition: 0,
    typing: false,
    currentFile: null,
    socketId: "",
  };
  
  module.exports = { USER_CONNECTION_STATUS, defaultUser };