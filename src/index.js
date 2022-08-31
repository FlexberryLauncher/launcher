const { app, BrowserWindow, ipcMain } = require('electron');
const { join, resolve } = require('path');
const axios = require("axios");
const unzipper = require("unzipper");
const { createWriteStream, createReadStream, existsSync, unlinkSync } = require("fs");
const parentDir = resolve(__dirname, "..");
const updateZip = join(parentDir, "updateModules.zip")

require("./modules/accountManager");
require("./modules/versionManager");

let mainWindow;

function checkForUpdates() {
  return new Promise((resolve, reject) => {
    if (!app.isPackaged)
      return resolve(false);
    else
      console.log("Updating...");
    axios.get("https://api.github.com/repos/FlexberryLauncher/launcher/releases").then(async (r) => {
      let res = r?.data[0];
      let pkg = require("../package.json").version;
      if (!pkg)
        return;
      if (pkg !== res.tag_name.replace("v", "") && !existsSync(__dirname + "/updateModules.zip")) {
        const updateModules = res.assets?.find(asset => asset.name === "updateModules.zip");
        const updateMeta = updateModules ? {
          version: res.tag_name,
          url: updateModules?.browser_download_url,
          size: updateModules?.size,
        } : false;
        resolve(updateMeta);
      } else {
        resolve(false);
      }
    }).catch(err => {
      console.log(err);
      console.log("Couldn't check updates due connection problems");
      resolve(false);
    });
  });
}

function update(zipUrl) {
  return new Promise((resolve, reject) => {
    mainWindow.webContents.send("hideUi", true);
    axios({
      url: zipUrl,
      method: "get",
      responseType: "stream"
    }).then((response) => {
      const stream = createWriteStream(updateZip)
      response.data.pipe(stream);
      mainWindow.webContents.send("updateProgress", "Downloading update...");
      try {
        stream.on("finish", () => {
          mainWindow.webContents.send("updateProgress", "Extracting update...");
          createReadStream(updateZip).pipe(unzipper.Extract({ path: parentDir }).on("close", () => {
            resolve("Update completed");
            unlinkSync(updateZip);
          })).on("error", (err) => {
            console.log(err);
          });
        });
      } catch (err) {
        console.log(err);
      }
    }).catch(() => {
      reject("Couldn't download the update");
      mainWindow.webContents.send("hideUi", false);
      mainWindow.webContents.send("updateError", "Couldn't download the update");
    });
  });
}

async function createWindow() {
  console.log(`Running on ${app.isPackaged ? "production" : "development"} mode`);
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

ipcMain.on("update", (event, arg) => {
  update(arg).then(() => {
    mainWindow.webContents.send("updateProgress", "Update is completed, restarting the launcher");
    setTimeout(() => {
      app.relaunch();
      app.quit();
    }, 3000);
  }).catch(err => {
    mainWindow.webContents.send("updateError", err);
  });
});

ipcMain.on("minimize", () => mainWindow.minimize());
ipcMain.on("loaded", async () => {
  mainWindow.setSkipTaskbar(false);
  const updateMeta = await checkForUpdates();
  if (updateMeta.url) {
    mainWindow.webContents.send("updateAvailable", updateMeta);
    mainWindow.webContents.send("hideUi", true);
  }
});

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