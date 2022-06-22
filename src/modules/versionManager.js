const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { ipcMain } = require("electron");

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

let pth = null;

if (process.platform == "win32") {
  pth = (path.join(process.env.APPDATA, "flexberry-launcher", "profiles.json"));
} else if (process.platform == "darwin") {
  pth = (path.join(process.env.HOME, "Library", "Application Support", "flexberry-launcher", "profiles.json"));
} else if (process.platform == "linux") {
  pth = (path.join(process.env.HOME, ".flexberry-launcher", "profiles.json"));
}

let dir = path.dirname(pth);

!fs.existsSync(dir) && fs.mkdirSync(dir) && console.log("Not found " + dir + " -- Creating it!");
!fs.existsSync(pth) && fs.openSync(pth, "w") && console.log("Not found " + pth + " -- Creating it!");

const adapter = new FileSync(pth);
const db = low(adapter)

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
    profile.isSelected = false;
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

  async selectProfile(profileName) {
    let ifExists = await db.get("profiles").find({
      appearance: {
        name: profileName
      }
    }).value();
    if (!ifExists)
      return { status: "error", message: "Profile not found" };
    console.log("[IPC] setSelected");
    await db.get("profiles").find({ isSelected: true}).assign({ isSelected: false }).write();
    await db.get("profiles").find({
      appearance: {
        name: profileName
      }
    }).assign({ isSelected: true }).write();
    let prfs = await db.get("profiles").value();
    this.profiles = prfs;
    this.selectedProfile = profileName;
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

  ipcMain.on("getProfiles", (event, arg) => {
    event.reply("profiles", versionManager.getProfiles());
  });

  ipcMain.on("getVersions", (event, arg) => {
    event.reply("versions", versionManager.getVersions());
  });

  ipcMain.on("getSelectedVersion", (event, arg) => {
    event.reply("selectedVersion", versionManager.getSelectedVersion());
  });

  ipcMain.on("getSelectedProfile", (event, arg) => {
    event.reply("selectedProfile", versionManager.getSelectedProfile());
  });

  ipcMain.on("getLatestVersion", (event, arg) => {
    event.reply("latestVersion", versionManager.getLatestVersion());
  });

  ipcMain.on("addProfile", async (event, arg) => {
    event.reply("profiles", (await versionManager.addProfile(arg)));
  });

  ipcMain.on("selectProfile", async (event, arg) => {
    event.reply("profiles", (await versionManager.selectProfile(arg)));
  });

  ipcMain.on("deleteProfile", async (event, arg) => {
    event.reply("profiles", (await versionManager.deleteProfile(arg)));
  });

  /*
  let random = versionManager.getVersions()[Math.floor(Math.random() * versionManager.getVersions().length)]
  versionManager.addProfile({
    version: random.id,
    type: random.type,
    appearance: {
      name: Math.random().toString(36).substring(2, 8)
    }
  });
  */
}