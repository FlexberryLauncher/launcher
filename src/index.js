const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const msmc = require("msmc");
require("./modules/accountManager");
require("./modules/versionManager");

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 830,
    height: 520,
    titleBarStyle: 'hidden',
    menuBarVisible: false,
    skipTaskbar: true,
    title: 'Flexberry Launcher',
    fullscreenable: false,
    resizable: false,
    icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    transparent: true,
    webPreferences: {
      spellcheck: false,
      preload: path.join(__dirname, "scripts", "preload.js"),
    }
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  if (process.platform === 'darwin')
    mainWindow.setWindowButtonVisibility(false);
};

ipcMain.on("minimize", () => mainWindow.minimize());
ipcMain.on("loaded", () => mainWindow.setSkipTaskbar(false));

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
