const { app, BrowserWindow, ipcMain } = require('electron');
const { join, resolve } = require('path');
require("./modules/accountManager");
require("./modules/versionManager");
let mainWindow;

const axios = require("axios");
const unzipper = require("unzipper")
const { createWriteStream, createReadStream, existsSync, unlinkSync } = require("fs");
const parentDir = resolve(__dirname, "..");
const updateZip = join(parentDir, "updateModules.zip")

const versionControl = () => {
  axios.get("https://api.github.com/repos/FlexberryLauncher/updater-test/releases/latest").then(async (res) => {
    if (process.env.npm_package_version !== res.data.tag_name && !existsSync(__dirname + "/updateModules.zip")) {
      axios({
        url: res.data.assets[0].browser_download_url,
        method: "get",
        responseType: "stream"
      }).then((response) => {
        const stream = createWriteStream(updateZip)
        response.data.pipe(stream);
        stream.on("finish", () => {
          createReadStream(updateZip).pipe(unzipper.Extract({ path: parentDir }).on("close", () => {
            unlinkSync(updateZip);
          }));
        });
      });
    }
  });
}

const createWindow = () => {
  try {
    versionControl();
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