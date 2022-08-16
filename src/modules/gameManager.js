const { app, ipcMain } = require("electron");
const { Client, Authenticator } = require("minecraft-launcher-core");
const msmc = require("msmc");
const low = require("lowdb");
const path = require("path");

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(path.join(app.getPath("userData"), "accounts.json"));
const db = low(adapter)

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
  
    async getCurrentAccount() {
      const selectedAccount = await db.get("accounts").find({ isSelected: true }).value();
      if (!selectedAccount)
        return null;
      return msmc.getMCLC().getAuth(selectedAccount.profile);
    }
  
    async launch(arg) {
      console.log("LAUNCHING");
      return new Promise(async (resolve, reject) => {
        const launcher = new Client();
        let version = {
          number: arg.actualVersion?.id || arg.id,
          type: arg.type
        }
        if (arg.actualVersion) 
          version.custom = arg.id;

        console.log(version);
        const launcherOptions = {
          clientPackage: null,
          root: this.minecraftDir,
          version,
          authorization: await this.getCurrentAccount() || Authenticator.getAuth("flexberry"+Math.floor(Math.random() * 999) + 1),
          memory: {
            max: arg.profile.memory + "M",
            min: arg.profile.memory + "M",
          },
          javaPath: "C:\\Program Files\\Java\\jdk-17\\bin\\java.exe",
          overrides: {
            gameDirectory: arg.profile.dir || this.minecraftDir,
          }
        }
        launcher.launch(launcherOptions).then(() => {
          console.log("LAUNCH -> PASS");
          this.alreadyLaunched = true;
          resolve(launcher);
        }).catch(err => {
          reject(err);
        });
      });
    }
  }
  
  const Minecraft = new GameManager();
  
  ipcMain.on("launch", async (event, arg) => {
    Minecraft.launch(arg).then((instance) => {
      console.log("RESOLVED");
      win.webContents.send("launched", true);
      instance.on("progress", (e) => {
        console.log(e);
        win.webContents.send("progress", e);
      });
      instance.on("debug", console.log);
      instance.on("data", console.log);
    });
  });  
}
