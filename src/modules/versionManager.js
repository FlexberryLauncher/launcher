const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { ipcMain } = require("electron");

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("profiles.json");
const db = low(adapter);

db.defaults({ profiles: [] }).write();

const appData = process.env.APPDATA;
const minecraftDir = path.join(appData, ".minecraft");
const versionsDir = path.join(minecraftDir, "versions");

class VersionManager {
  constructor() {
    this.versions = [];
    this.latest = {};
    this.selectedVersion = null;
    this.selectedProfile = null;
    this.doesExist = false;
  }

  async init() {
    if (fs.existsSync(versionsDir) || fs.existsSync(minecraftDir))
      this.doesExist = false;
    await this.loadVersions();
    await this.loadProfiles();
    ipcManager();
  }

  async loadVersions() {
    let apiVersions = await this.getVersionFromAPI();
    let versionFolders = [];
    let versions = [];
    fs.readdir(versionsDir, (err, files) => {
      if (err)
        return console.error(err);
      files.forEach(file => {
        if (fs.lstatSync(path.join(versionsDir, file)).isDirectory())
          versionFolders.push(file);
      });
    });
    await Promise.all(versionFolders.map(async (versionFolder) => {
      let stats = null;
      fs.stat(path.join(versionsDir, versionFolder), (err, stats) => {
        if (err)
          return console.error(err);
        stats = stats;
      });
      if (!stats.isDirectory())
        return;
      if (versionFolder.startsWith("."))
        return;
      let versionDir = [];
      fs.readdir(path.join(versionsDir, versionFolder), (err, files) => {
        if (err)
          return console.error(err);
        versionDir = files;
      });
      let versionData = null;
      fs.readFile(path.join(versionsDir, versionFolder, versionFolder + ".json"), (err, data) => {
        if (err)
          return console.error(err);
        versionData = JSON.parse(data);
      });
      if (!(versionDir.includes(versionFolder + ".json") && versionDir.includes(versionFolder + ".jar")))
        return;
      return {
        id: versionData.id,
        java: versionData.javaVersion ? versionData.javaVersion.majorVersion : 16,
        releaseTime: versionData.inheritsFrom ? apiVersions.versions.filter(version => version.id ==  versionData.inheritsFrom)[0].releaseTime : versionData.releaseTime,
        actualReleaseTime: versionData.releaseTime,
        type: versionData.type,
      };
    }));
    versions = versions.concat(apiVersions.versions.map(version => {
      return {
        id: version.id,
        java: null, // do not change, this property also defines if version is local or not
        releaseTime: version.releaseTime,
        type: version.type,
      }
    }));
    versions = versions.filter(file => file);
    this.latest = apiVersions.latest;
    this.versions = versions;
  }

  async loadProfiles() {
    let profiles = await db.get("profiles").value();
    this.profiles = profiles;
  }

  async addProfile(profile) {
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
    // check if profile already exists
    let profileExists = await db.get("profiles").find({
      appearance: {
        name: profile.appearance.name
      }
    }).value();
    if (profileExists)
      return { status: "error", message: "Profile already exists" };
    // add profile
    let newProfiles = await db.get("profiles").push(profile).write();
    console.log(newProfiles)
    this.profiles = newProfiles;
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

  getProfiles() {
    return this.profiles;
  }

  getVersions() {
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

  async getVersionFromAPI() {
    let version = await fetch(`https://launchermeta.mojang.com/mc/game/version_manifest.json`);
    let json = await version.json();
    return json;
  }

  getLatestVersion() {
    return this.latest;
  }
}

const versionManager = new VersionManager();
versionManager.init();

async function ipcManager() {
  // profile = selected version, not account!

  ipcMain.on("getVersions", async (event) => {
    let versions = await versionManager.getVersions();
    event.sender.send("getVersions", versions);
  });

  ipcMain.on("getProfiles", async (event) => {
    let profiles = await versionManager.getProfiles();
    event.sender.send("getProfiles", profiles);
  });

  ipcMain.on("getLatestVersion", async (event) => {
    let latest = await versionManager.getLatestVersion();
    event.sender.send("getLatestVersion", latest);
  });

  ipcMain.on("addProfile", async (event, profile) => {
    let addedProfile = await versionManager.addProfile(profile);
    event.sender.send("addProfile", addedProfile);
  });

  ipcMain.on("deleteProfile", async (event, profileName) => {
    let deletedProfile = await versionManager.deleteProfile(profileName);
    event.sender.send("deleteProfile", deletedProfile);
  });

  ipcMain.on("setSelectedVersion", async (event, version) => {
    versionManager.selectedVersion = version;
  });

  ipcMain.on("setSelectedProfile", async (event, profile) => {
    versionManager.selectedProfile = profile;
  });
}