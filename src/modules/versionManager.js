const fs = require("fs");
const path = require("path");
const fetch = require("axios");
const { app, ipcMain } = require("electron");

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync(path.join(app.getPath("userData"), "profiles.json"));
const db = low(adapter)

const berry = require("./logger")();

db.defaults({ profiles: [] }).write();

let [appData, minecraftDir, versionsDir] = [];

if (process.platform == "win32") {
  appData = process.env.APPDATA;
  minecraftDir = path.join(appData, ".minecraft");
  versionsDir = path.join(minecraftDir, "versions");
} else if (process.platform == "darwin") {
  appData = process.env.HOME;
  minecraftDir = path.join(appData, "Library", "Application Support", "minecraft");
  versionsDir = path.join(minecraftDir, "versions");
} else if (process.platform == "linux") {
  appData = process.env.HOME;
  minecraftDir = path.join(appData, ".minecraft");
  versionsDir = path.join(minecraftDir, "versions");
} else {
  // TO-DO - add popup for error
  throw new Error("Unsupported platform");
}

module.exports = (win) => {
  class VersionManager {
    constructor() {
      this.versions = [];
      this.latest = {};
      this.selectedVersion = null;
      this.selectedProfile = null;
      this.doesExist = false;
      this.active = false;
    }

    async init() {
      try {
        if (!fs.existsSync(versionsDir)) {
          fs.mkdirSync(versionsDir, { recursive: true });
        }
      } catch (e) { 
        berry.error("Couldn't create versions directory!!! Stack:\n" + e.stack, "versionManager");
      }
      if (db.get("profiles").size().value() == 0) {
        this.addProfile({
          version: this.latest.release,
          type: "release",
          memory: 2048,
          dimensions: {
            height: 600,
            width: 720
          },
          appearance: {
            icon: "crying_obsidian",
            name: "Latest Release",
          },
          isSelected: true,
          latest: true
        });
      }
      console.time("loadVersions");
      await this.loadVersions();
      try {
        let firstProfile = await db.get("profiles").find({ latest: true }).value();
        if (firstProfile.version != this.latest.release) {
          firstProfile.version = this.latest.release;
          db.get("profiles").find({ latest: true }).assign(firstProfile).write();
        }
      } catch {
        berry.error("Could not set Latest Release profile to latest release of Minecraft", "versionManager");
      }
      await this.loadProfiles();
      ipcManager();
    }

    async loadVersions() {
      let apiVersions = await this.getVersionFromAPI();
      let versions = [];
      try {
        if (fs.existsSync(versionsDir)) {
          let versionFolders = fs.readdirSync(versionsDir);
          versionFolders.forEach((versionFolder) => {
            let stats = fs.statSync(path.join(versionsDir, versionFolder));
            if (versionFolder.startsWith("."))
              return;
            if (!stats.isDirectory())
              return;
            let versionDir = fs.readdirSync(path.join(versionsDir, versionFolder));
            if (!(versionDir.includes(versionFolder + ".json") && versionDir.includes(versionFolder + ".jar")))
              return;
            let versionData = JSON.parse(fs.readFileSync(path.join(versionsDir, versionFolder, versionFolder + ".json")));
            if (apiVersions.versions.map(v => v.id).includes(versionFolder))
              return;
            versions.push({
              id: versionData.id,
              java: versionData.javaVersion ? versionData.javaVersion.majorVersion : 16,
              releaseTime: versionData.inheritsFrom ? apiVersions.versions.filter(version => version.id ==  versionData.inheritsFrom)[0]?.releaseTime : versionData.releaseTime,
              actualReleaseTime: versionData.releaseTime,
              actualVersion: apiVersions.versions.find(v => v?.id == versionData?.inheritsFrom) || undefined,
              type: versionData.type
            });
          });
        }
      } catch (e) {
        berry.error("Couldn't load versions Stack:\n" + e.stack, "versionManager");
      }
      versions = versions.concat(apiVersions.versions.map(version => {
        return {
          id: version.id,
          java: null, // glitchy
          url: version.url,
          releaseTime: version.releaseTime,
          type: version.type,
        }
      }));
      versions = versions.filter(file => file);
      this.latest = apiVersions.latest;
      this.versions = versions;
    }

    async loadProfiles() {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      let profiles = await db.get("profiles").value();
      this.profiles = profiles;
    }

    async addProfile(profile = {}) {
      profile.version = profile.version || this.latest.release;
      profile.type = profile.type || "release";
      profile.memory = profile.memory || 2048;
      profile.dimensions = profile.dimensions || {
        height: 600,
        width: 720
      };
      profile.appearance = profile.appearance || {
        icon: "glass",
        name: "Latest Release",
      };
      profile.isSelected = profile.isSelected || false;
      profile.acronym = profile.appearance.name.replace(/\s/g, "").toLowerCase();
      let profileExists = await db.get("profiles").find({
        acronym: profile.appearance.name.replace(/\s/g, "").toLowerCase()
      }).value();
      if (profileExists)
        return { status: "error", message: "Profile already exists" };
      let newProfiles = await db.get("profiles").push(profile).write();
      this.profiles = newProfiles;
      return this.profiles;
    }

    async editProfile(profile) {
      let dbProfile = await db.get("profiles").find({ acronym: profile.acronym });
      profile.acronym = profile.appearance.name.replace(/\s/g, "").toLowerCase();
      await dbProfile.assign(profile).write();
      return this.profiles;
    }

    async selectProfile(profileName) {
      let ifExists = await db.get("profiles").find({
        appearance: {
          name: profileName
        }
      }).value();
      if (!ifExists)
        return { status: "error", message: "Profile not found" };
      await db.get("profiles").find({ isSelected: true}).assign({ isSelected: false }).write();
      await db.get("profiles").find({
        appearance: {
          name: profileName
        }
      }).assign({ isSelected: true }).write();
      let prfs = await db.get("profiles").value();
      this.profiles = prfs;
      this.selectedProfile = profileName;
      berry.log("Selected profile " + profileName, "versionManager");
      return this.profiles;
    }

    async deleteProfile(profileName) {
      let profiles = db.get("profiles");
      let profile = await profiles.find({
        appearance: {
          name: profileName
        }
      }).value();
      if (!profile)
        return { status: "error", message: "Profile does not exist" };
      await profiles.remove({
        appearance: {
          name: profileName
        }
      }).write();
      this.profiles = await profiles.value();
      return this.profiles;
    }

    async getProfiles() {
      return await db.get("profiles").value();
    }

    async getVersions() {
      if (!this.versions[0])
        await this.loadVersions();
      return this.versions.sort((a, b) => {
        if (a.releaseTime > b.releaseTime)
          return -1;
        if (a.releaseTime < b.releaseTime)
          return 1;
        return 0;
      });
    }

    getSelectedVersion() {
      return this.selectedVersion;
    }

    getSelectedProfile() {
      return this.selectedProfile;
    }

    getVersionFromAPI() {
      return fetch(`https://launchermeta.mojang.com/mc/game/version_manifest.json`).then(function (res) {
        return res.data;
      }).catch(err => {
        console.error("Mojang servers are down or you have no connection");
        return {
          latest: [],
          versions: []
        };
      })
    }

    getLatestVersion() {
      return this.latest;
    }
  }

  const versionManager = new VersionManager();
  versionManager.init();

  async function ipcManager() {
    berry.log("Starting IPC modules of versionManager", "versionManager");

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    ipcMain.handle("getProfiles", async () => {
      return await versionManager.getProfiles();
    });
    
    ipcMain.handle("getVersions", async () => {
      return await versionManager.getVersions();
    });
      
    ipcMain.on("getSelectedVersion", (event) => {
      event.reply("selectedVersion", versionManager.getSelectedVersion());
    });

    ipcMain.on("getSelectedProfile", (event) => {
      event.reply("selectedProfile", versionManager.getSelectedProfile());
    });

    ipcMain.on("getLatestVersion", (event) => {
      event.reply("latestVersion", versionManager.getLatestVersion());
    });

    ipcMain.on("addProfile", async (event, arg) => {
      event.reply("profiles", (await versionManager.addProfile(arg)));
    });

    ipcMain.on("editProfile", async (event, arg) => {
      event.reply("profiles", (await versionManager.editProfile(arg)));
    });

    ipcMain.on("selectProfile", async (event, arg) => {
      event.reply("profiles", (await versionManager.selectProfile(arg)));
    });

    ipcMain.on("deleteProfile", async (event, arg) => {
      event.reply("profiles", (await versionManager.deleteProfile(arg)));
    });

    function pong() {
      win.webContents.send("pong", { from: "versionManager", call: ["getVersions", "getProfiles"] });
    };

    ipcMain.on("ping", pong);
    pong();
  }
}