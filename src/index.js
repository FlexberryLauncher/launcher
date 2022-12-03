const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { join } = require('path');
const axios = require("axios");
const { createWriteStream, existsSync, unlinkSync, copyFile } = require("fs");
const tempDir = join(__dirname, "..", "..")

const pkg = require("../package.json").version;

let mainWindow;
let isEverythingLoadedCorrectly = false;

const berry = require("./modules/logger")();

berry.log("Starting Flexberry Launcher...");

function checkForUpdates() {
  return new Promise((resolve, reject) => {
    if (!app.isPackaged)
      return resolve(false);
    else
      berry.log("Checking for updates...");
    /* 
     * if you want to make updater only check for stable releases change add /latest to the url
     * and remove [0] from res
     */
    axios.get("https://api.github.com/repos/FlexberryLauncher/launcher/releases").then(async (r) => {
      berry.log("Got response from GitHub API");
      let res = r?.data[0];
      if (!pkg)
        return;
      if (pkg !== res.tag_name.replace("v", "") && !existsSync(join(__dirname, "..", "..", "update.asar"))) {
        berry.log("Update is available, downloading...");
        const updateModules = res.assets?.find(asset => asset.name.includes("asar"));
        const updateMeta = updateModules ? {
          version: res.tag_name,
          url: updateModules?.browser_download_url,
          size: updateModules?.size,
        } : false;
        mainWindow.webContents.send("progress", { type: "update", message: `Downloading new version ${updateMeta.version} with size of ${(updateMeta.size / 1024 / 1024).toFixed(1)} MB` });
        resolve(updateMeta);
      } else {
        resolve(false);
      }
    }).catch(err => {
      berry.error("Couldn't check for updates");
      berry.error(err);
      resolve(false);
    });
  });
}

function update(url) {
  return new Promise((resolve, reject) => {
    axios({
      url,
      responseType: "stream"
    }).then((response) => {
      // You can replace .flexberry with anything you want except .asar!
      try {
      response.data.pipe(createWriteStream(join(tempDir, "app.flexberry")))
        .on("finish", () => {
          copyFile(join(tempDir, "app.flexberry"), join(tempDir, "app.asar"), (err) => {
            if (err) {
              berry.error("Couldn't copy update file");
              berry.error(err);
              reject(err);
            } else {
              berry.log("Update is completed, restarting...");
              resolve(true);
              unlinkSync(join(tempDir, "app.flexberry"));
            }
          });
          resolve(true);
        })
        .on("error", reject);
      } catch (err) {
        reject(err);
      };
    }).catch(() => {
      reject("Couldn't update, please restart the launcher.");
      berry.error("Couldn't download the update");
    });
  });
}

function createWindow() {
  berry.log("Launcher is running in production mode. Version: " + pkg);
  mainWindow = new BrowserWindow({
    width: 900,
    height: 510,
    minWidth: 900,
    minHeight: 510,
    titleBarStyle: "hidden",
    menuBarVisible: false,
    skipTaskbar: true,
    title: "Flexberry Launcher",
    fullscreenable: false,
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
  require("./modules/versionManager")(mainWindow);
  require("./modules/accountManager")(mainWindow);
};

ipcMain.handle("openDirectory", async (event, path) => {
  const defaultPath = process.platform == "win32" ? join(app.getPath("appData"), ".minecraft") : process.platform == "darwin" ? join(app.getPath("appData"), "minecraft") : process.platform == "linux" ? join(app.getPath("home"), ".minecraft") : null;
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    defaultPath,
    title: "Select your Minecraft directory",
  });
  if (filePaths[0])
    return filePaths[0];
  else
    return false;
});

ipcMain.on("getMeta", async (event) => {
  event.returnValue = {
    isEverythingLoadedCorrectly,
    launcher: {
      version: pkg,
    },
    system: {
      memory: require("os").totalmem(),
      platform: process.platform,
    }
  };
});

ipcMain.on("loaded", async () => {
  isEverythingLoadedCorrectly = true;
  mainWindow.setSkipTaskbar(false);
  mainWindow.focus();
  const updateMeta = await checkForUpdates();
  if (updateMeta.url) {
    // TO-DO: Ask user if they wants to update
    update(updateMeta.url).then(() => {
      mainWindow.webContents.send("progress", { type: "update", message: "Update is completed, restarting the launcher" });
      setTimeout(() => {
        app.relaunch();
        app.quit();
      }, 2000);
    }).catch(err => {
      berry.error(err);
      mainWindow.webContents.send("progress", { type: "update", error: true, message: err });
    });
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

app.on("quit", () => {
  berry.log("Launcher is closed");
  berry.log("$1");
});