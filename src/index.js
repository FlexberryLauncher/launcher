const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const msmc = require("msmc");
require("./modules/accountManager");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 830,
    height: 566,
    titleBarStyle: 'hidden',
    fullscreenable: false,
    resizable: false,
    icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "scripts", "preload.js"),
    },
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  ipcMain.on("minimize", () => mainWindow.minimize());
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
