const { contextBridge, ipcRenderer, shell } = require("electron");

contextBridge.exposeInMainWorld(
  "IPC", {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  sendSync: (channel, data) => {
    return ipcRenderer.sendSync(channel, data);
  },
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  }
});

contextBridge.exposeInMainWorld("shell", {
  openExternal: (url) => {
    shell.openExternal(url);
  }
});