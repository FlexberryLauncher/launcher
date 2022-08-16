const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
require("./modules/accountManager");
require("./modules/versionManager");
const { checkUpdates } = require("./modules/updater");
let mainWindow;


const createWindow = () => {
  try {
    checkUpdates();
  } catch (error) {
    // TO-DO - An error occured during version control.
  }

  mainWindow = new BrowserWindow({
    width: 830,
    height: 520,
    titleBarStyle: "hidden",
    menuBarVisible: false,
    skipTaskbar: true,
    title: "Flexberry Launcher",
    fullscreenable: false,
    resizable: false,
    icon: join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    transparent: true,
    webPreferences: {
      spellcheck: false,
      preload: join(__dirname, "scripts", "preload.js"),
    }
  });
  mainWindow.loadFile(join(__dirname, "index.html"));
  if (process.platform === "darwin")
    mainWindow.setWindowButtonVisibility(false);
  require("./modules/gameManager")(mainWindow);
};

ipcMain.on("minimize", () => mainWindow.minimize());
ipcMain.on("loaded", () => mainWindow.setSkipTaskbar(false));

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});