var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var path = require("path");
var fetch = require("axios");
var app = require("electron").app;
var low = require("lowdb");
var FileSync = require("lowdb/adapters/FileSync");
var adapter = new FileSync(path.join(app.getPath("userData"), "profiles.json"));
var db = low(adapter);
db.defaults({ profiles: [] }).write();
var _a = [], appData = _a[0], minecraftDir = _a[1], versionsDir = _a[2];
if (process.platform == "win32") {
    appData = process.env.APPDATA;
    minecraftDir = path.join(appData, ".minecraft");
    versionsDir = path.join(minecraftDir, "versions");
}
else if (process.platform == "darwin") {
    appData = process.env.HOME;
    minecraftDir = path.join(appData, "Library", "Application Support", "minecraft");
    versionsDir = path.join(minecraftDir, "versions");
}
else if (process.platform == "linux") {
    appData = process.env.HOME;
    minecraftDir = path.join(appData, ".minecraft");
    versionsDir = path.join(minecraftDir, "versions");
}
else {
    // TO-DO - add popup for error
    throw new Error("Unsupported platform");
}
var VersionManager = /** @class */ (function () {
    function VersionManager() {
        this.versions = [];
        this.latest = {};
        this.selectedVersion = null;
        this.selectedProfile = null;
        this.doesExist = false;
    }
    VersionManager.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (fs.existsSync(versionsDir) || fs.existsSync(minecraftDir))
                            this.doesExist = false;
                        return [4 /*yield*/, this.loadVersions()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.loadProfiles()];
                    case 2:
                        _a.sent();
                        ipcManager();
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
                                    name: "Latest Release"
                                },
                                isSelected: true
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    VersionManager.prototype.loadVersions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var apiVersions, versionFolders, versions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getVersionFromAPI()];
                    case 1:
                        apiVersions = _a.sent();
                        versionFolders = fs.readdirSync(versionsDir);
                        versions = [];
                        versionFolders.forEach(function (versionFolder) {
                            var _a;
                            var stats = fs.statSync(path.join(versionsDir, versionFolder));
                            if (versionFolder.startsWith("."))
                                return;
                            if (!stats.isDirectory())
                                return;
                            var versionDir = fs.readdirSync(path.join(versionsDir, versionFolder));
                            if (!(versionDir.includes(versionFolder + ".json") &&
                                versionDir.includes(versionFolder + ".jar")))
                                return;
                            var versionData = JSON.parse(fs.readFileSync(path.join(versionsDir, versionFolder, versionFolder + ".json")));
                            if (apiVersions.versions.map(function (v) { return v.id; }).includes(versionFolder))
                                return;
                            versions.push({
                                id: versionData.id,
                                java: versionData.javaVersion ? versionData.javaVersion.majorVersion : 16,
                                releaseTime: versionData.inheritsFrom
                                    ? (_a = apiVersions.versions.filter(function (version) { return version.id == versionData.inheritsFrom; })[0]) === null || _a === void 0 ? void 0 : _a.releaseTime
                                    : versionData.releaseTime,
                                actualReleaseTime: versionData.releaseTime,
                                actualVersion: apiVersions.versions.find(function (v) { return (v === null || v === void 0 ? void 0 : v.id) == (versionData === null || versionData === void 0 ? void 0 : versionData.inheritsFrom); }) || undefined,
                                type: versionData.type
                            });
                        });
                        versions = versions.concat(apiVersions.versions.map(function (version) {
                            return {
                                id: version.id,
                                java: null,
                                url: version.url,
                                releaseTime: version.releaseTime,
                                type: version.type
                            };
                        }));
                        versions = versions.filter(function (file) { return file; });
                        this.latest = apiVersions.latest;
                        this.versions = versions;
                        return [2 /*return*/];
                }
            });
        });
    };
    VersionManager.prototype.loadProfiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var profiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.get("profiles").value()];
                    case 1:
                        profiles = _a.sent();
                        this.profiles = profiles;
                        return [2 /*return*/];
                }
            });
        });
    };
    VersionManager.prototype.addProfile = function (profile) {
        if (profile === void 0) { profile = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var profileExists, newProfiles;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        profile.version = profile.version || this.latest.release;
                        profile.type = profile.type || "release";
                        profile.memory = profile.memory || 2048;
                        profile.dimensions = profile.dimensions || {
                            height: 600,
                            width: 720
                        };
                        profile.appearance = profile.appearance || {
                            icon: "glass",
                            name: "Latest Release"
                        };
                        profile.isSelected = profile.isSelected || false;
                        profile.acronym = profile.appearance.name.replace(/\s/g, "").toLowerCase();
                        return [4 /*yield*/, db
                                .get("profiles")
                                .find({
                                acronym: profile.appearance.name.replace(/\s/g, "").toLowerCase()
                            })
                                .value()];
                    case 1:
                        profileExists = _a.sent();
                        if (profileExists)
                            return [2 /*return*/, { status: "error", message: "Profile already exists" }];
                        return [4 /*yield*/, db.get("profiles").push(profile).write()];
                    case 2:
                        newProfiles = _a.sent();
                        this.profiles = newProfiles;
                        return [2 /*return*/, this.profiles];
                }
            });
        });
    };
    VersionManager.prototype.selectProfile = function (profileName) {
        return __awaiter(this, void 0, void 0, function () {
            var ifExists, prfs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db
                            .get("profiles")
                            .find({
                            appearance: {
                                name: profileName
                            }
                        })
                            .value()];
                    case 1:
                        ifExists = _a.sent();
                        if (!ifExists)
                            return [2 /*return*/, { status: "error", message: "Profile not found" }];
                        console.log("[IPC] setSelected");
                        return [4 /*yield*/, db.get("profiles").find({ isSelected: true }).assign({ isSelected: false }).write()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, db
                                .get("profiles")
                                .find({
                                appearance: {
                                    name: profileName
                                }
                            })
                                .assign({ isSelected: true })
                                .write()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, db.get("profiles").value()];
                    case 4:
                        prfs = _a.sent();
                        this.profiles = prfs;
                        this.selectedProfile = profileName;
                        return [2 /*return*/, this.profiles];
                }
            });
        });
    };
    VersionManager.prototype.deleteProfile = function (profileName) {
        return __awaiter(this, void 0, void 0, function () {
            var profiles, profile, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        profiles = db.get("profiles");
                        return [4 /*yield*/, profiles
                                .find({
                                appearance: {
                                    name: profileName
                                }
                            })
                                .value()];
                    case 1:
                        profile = _b.sent();
                        if (!profile)
                            return [2 /*return*/, { status: "error", message: "Profile does not exist" }];
                        return [4 /*yield*/, profiles
                                .remove({
                                appearance: {
                                    name: profileName
                                }
                            })
                                .write()];
                    case 2:
                        _b.sent();
                        _a = this;
                        return [4 /*yield*/, profiles.value()];
                    case 3:
                        _a.profiles = _b.sent();
                        return [2 /*return*/, this.profiles];
                }
            });
        });
    };
    VersionManager.prototype.getProfiles = function () {
        return this.profiles;
    };
    VersionManager.prototype.getVersions = function () {
        return this.versions.sort(function (a, b) {
            if (a.releaseTime > b.releaseTime)
                return -1;
            if (a.releaseTime < b.releaseTime)
                return 1;
            return 0;
        });
    };
    VersionManager.prototype.getSelectedVersion = function () {
        return this.selectedVersion;
    };
    VersionManager.prototype.getSelectedProfile = function () {
        return this.selectedProfile;
    };
    VersionManager.prototype.getVersionFromAPI = function () {
        return fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json")
            .then(function (res) {
            return res.data;
        })["catch"](function (err) {
            console.error("Mojang servers are down or you have no connection");
            return {
                latest: [],
                versions: []
            };
        });
    };
    VersionManager.prototype.getLatestVersion = function () {
        return this.latest;
    };
    return VersionManager;
}());
var versionManager = new VersionManager();
versionManager.init();
function ipcManager() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            // profile = selected version, not account!
            console.log("[IPC] ipcManager");
            ipcMain.on("getProfiles", function (event, arg) {
                event.reply("profiles", versionManager.getProfiles());
            });
            ipcMain.on("getVersions", function (event, arg) {
                event.reply("versions", versionManager.getVersions());
            });
            ipcMain.on("getSelectedVersion", function (event, arg) {
                event.reply("selectedVersion", versionManager.getSelectedVersion());
            });
            ipcMain.on("getSelectedProfile", function (event, arg) {
                event.reply("selectedProfile", versionManager.getSelectedProfile());
            });
            ipcMain.on("getLatestVersion", function (event, arg) {
                event.reply("latestVersion", versionManager.getLatestVersion());
            });
            ipcMain.on("addProfile", function (event, arg) { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _b = (_a = event).reply;
                            _c = ["profiles"];
                            return [4 /*yield*/, versionManager.addProfile(arg)];
                        case 1:
                            _b.apply(_a, _c.concat([_d.sent()]));
                            return [2 /*return*/];
                    }
                });
            }); });
            ipcMain.on("selectProfile", function (event, arg) { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _b = (_a = event).reply;
                            _c = ["profiles"];
                            return [4 /*yield*/, versionManager.selectProfile(arg)];
                        case 1:
                            _b.apply(_a, _c.concat([_d.sent()]));
                            return [2 /*return*/];
                    }
                });
            }); });
            ipcMain.on("deleteProfile", function (event, arg) { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _b = (_a = event).reply;
                            _c = ["profiles"];
                            return [4 /*yield*/, versionManager.deleteProfile(arg)];
                        case 1:
                            _b.apply(_a, _c.concat([_d.sent()]));
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
//# sourceMappingURL=versionManager.js.map