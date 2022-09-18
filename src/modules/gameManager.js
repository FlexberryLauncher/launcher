const { app, ipcMain } = require("electron");
const { Client, Authenticator } = require("minecraft-launcher-core");
const msmc = require("msmc");
const low = require("lowdb");
const path = require("path");
const axios = require("axios");
const https = require("https");
const fs = require("fs");

const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(path.join(app.getPath("userData"), "accounts.json"));
const db = low(adapter);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logPath = path.join(app.getPath("logs"), "launcher.log");
const berry = require("./logger")(logPath);

module.exports = (win) => {
  class GameManager {
    constructor() {
      // set minecraftDir depends on platform
      if (process.platform == "win32") {
        this.minecraftDir = path.join(app.getPath("appData"), ".minecraft");
      } else if (process.platform == "darwin") {
        this.minecraftDir = path.join(app.getPath("appData"), "minecraft");
      } else if (process.platform == "linux") {
        this.minecraftDir = path.join(app.getPath("home"), ".minecraft");
      } else {
        // TO-DO - add popup for error
        throw new Error("Unsupported platform");
      }

      this.alreadyLaunched = false;
    }

    async downloadJava(javaVersionCode) {
      return new Promise(async (resolve, reject) => {
        const javaPath = path.join(this.minecraftDir, "flexberry-jre", javaVersionCode, "bin", "javaw.exe");
        if (fs.existsSync(javaPath)) {
          win.webContents.send("progress", "Required Java is already installed, skipping installation");
          return resolve(javaPath);
        } else {
          require("./javaManager")(javaVersionCode)
            .then(async (java) => {
              try {
                let res = await axios(java.manifest.url);
                const files = Object.keys(res.data.files).map((file) => {
                  return { name: file, downloads: res.data.files[file].downloads, type: res.data.files[file].type };
                });

                let directory = files.filter((file) => file.type == "directory");
                let filesToDownload = files.filter((file) => file.type == "file");

                let javaDirs = [this.minecraftDir, "flexberry-jre", javaVersionCode]
                javaDirs.forEach((dir, i) => {
                  let _dir = javaDirs.slice(0, i + 1).join(path.sep);
                  if (!fs.existsSync(_dir)) {
                    berry.log(`Creating directory ${_dir}`, "gameManager");
                    win.webContents.send("progress", "Creating directory: " + _dir);
                    fs.mkdirSync(_dir);
                  }
                });

                console.time("createDir");
                directory.forEach((dir) => {
                  berry.log(`Creating directory ${dir.name}`, "gameManager");
                  win.webContents.send("progress", "Creating directory: " + dir.name);
                  fs.mkdirSync(path.join(this.minecraftDir, "flexberry-jre", javaVersionCode, dir.name));
                });
                console.timeEnd("createDir");

                console.time("downloadFiles");
                let downloadedFiles = 0;
                for (let file of filesToDownload) {
                  win.webContents.send("progress", { type: "Java", task: downloadedFiles, total: filesToDownload.length });
                  let download = await axios.get(file.downloads["raw"].url, { responseType: "stream", timeout: 2147483647, httpsAgent: new https.Agent({ keepAlive: true }) });
                  let stream = fs.createWriteStream(path.join(this.minecraftDir, "flexberry-jre", javaVersionCode, file.name));
                  download.data.pipe(stream);
                  stream.on("finish", () => {
                    downloadedFiles++;
                    win.webContents.send("progress", { type: "Java", task: downloadedFiles, total: filesToDownload.length });
                    berry.log(downloadedFiles + " of " + filesToDownload.length + " files downloaded (" + file.name + ")", "gameManager");
                    if (downloadedFiles == filesToDownload.length) {
                      console.timeEnd("downloadFiles");
                      return resolve(javaPath);
                    }
                  });
                }
              } catch (err) {
                berry.error(err);
                return reject("Could not download java")
              }
            })
            .catch((err) => {
              berry.error(err);
              return reject(err);
            });
        }
      });
    }

    async getCurrentAccount() {
      const selectedAccount = await db.get("accounts").find({ isSelected: true }).value();
      if (!selectedAccount)
        return null;
      return msmc.getMCLC().getAuth(selectedAccount.profile);
    }

    async launch(arg) {
      return new Promise(async (resolve, reject) => {
        let versionMetaURL = arg.url || arg.actualVersion.url;
        let versionMeta = {};
        try {
          versionMeta = (await axios.get(versionMetaURL)).data;
        } catch (err) {
          berry.error("Could not get version meta Stack:\n" + err?.stack, "gameManager");
          reject({ code: 777, error: "Could not download version meta, skipping automatic java download" });
        }
        const javaVersionCode = versionMeta?.javaVersion?.component || "jre-legacy";
        /*
          currently only 1.6.x versions does not have javaVersion.component property, jre-legacy is used instead
          if Mojang decides to change the API, it'll attemp to use jre-legacy for all versions
          and jre-legacy won't launch versions over 1.16
        */
        let javaPath;
        try {
          javaPath = await this.downloadJava(javaVersionCode)
        } catch (err) {
          win.webContents.send("progress", "Could not download java, skipping automatic java download");
          reject({ code: 778, error: "Could not download java, " + err });
        }
        berry.log("Java path: " + javaPath, "gameManager");
        const launcher = new Client();
        let version = {
          number: arg.actualVersion?.id || arg.id,
          type: arg.type
        }
        if (arg.actualVersion)
          version.custom = arg.id;

        berry.log("Launching version " + (version.custom || version.number), "gameManager");
        const launcherOptions = {
          clientPackage: null,
          root: this.minecraftDir,
          version,
          authorization: await this.getCurrentAccount() || Authenticator.getAuth("flexberry" + Math.floor(Math.random() * 999) + 1),
          memory: {
            max: (+arg.profile.memory) + "M",
            min: (+arg.profile.memory) - 512 + "M",
          },
          window: {
            width: +arg.profile.dimensions.width,
            height: +arg.profile.dimensions.height
          },
          overrides: {
            gameDirectory: arg.profile.dir || this.minecraftDir,
          }
        }
        javaPath && (launcherOptions.javaPath = javaPath);
        
        launcher.on("progress", (e) => {
          win.webContents.send("progress", e);
        });
        await wait(1000);
        launcher.launch(launcherOptions).then(() => {
          this.alreadyLaunched = true;
          resolve(launcher);
        }).catch(err => {
          berry.error(err, "gameManager");
          reject({
            code: 580,
            error: err
          });
        });
      });
    }
  }

  const Minecraft = new GameManager();

  ipcMain.on("launch", async (event, arg) => {
    win.webContents.send("hideUi", true);
    Minecraft.launch(arg).then((instance) => {
      win.webContents.send("progress", "Launching");
      instance.on("data", (d) => {
        // berry.log("[Minecraft] " + d, "gameManager", true);
        if (win.isVisible()) {
          win.webContents.send("hideUi", true);
          win.hide();
        }
      });
      instance.on("close", (d) => {
        berry.log("Minecraft is closed: " + d);
        if (!win.isVisible()) {
          win.webContents.send("hideUi", false);
          win.show();
        }
      });
    }).catch(err => {
      berry.error(err, "gameManager");
    });
  });
}
