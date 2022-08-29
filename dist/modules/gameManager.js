"use strict";
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
exports.__esModule = true;
var _a = require("minecraft-launcher-core"), Client = _a.Client, Authenticator = _a.Authenticator;
var msmc = require("msmc");
var https = require("https");
var promises_1 = require("timers/promises");
module.exports = function (win) {
    var GameManager = /** @class */ (function () {
        function GameManager() {
            // set minecraftDir depends on platform
            if (process.platform == "win32") {
                this.minecraftDir = path.join(app.getPath("appData"), ".minecraft");
            }
            else if (process.platform == "darwin") {
                this.minecraftDir = path.join(app.getPath("appData"), "minecraft");
            }
            else if (process.platform == "linux") {
                this.minecraftDir = path.join(app.getPath("home"), ".minecraft");
            }
            else {
                // TO-DO - add popup for error
                throw new Error("Unsupported platform");
            }
            this.alreadyLaunched = false;
        }
        GameManager.prototype.downloadJava = function (javaVersionCode) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var javaPath;
                            var _this = this;
                            return __generator(this, function (_a) {
                                javaPath = path.join(this.minecraftDir, "flexberry-jre", javaVersionCode, "bin", "javaw.exe");
                                if (fs.existsSync(javaPath)) {
                                    win.webContents.send("progress", "Required Java is already installed, skipping installation");
                                    return [2 /*return*/, resolve(javaPath)];
                                }
                                else {
                                    require("./javaManager")(javaVersionCode)
                                        .then(function (java) { return __awaiter(_this, void 0, void 0, function () {
                                        var res_1, files, directory, filesToDownload_2, javaDirs_1, downloadedFiles_1, _loop_1, this_1, _i, filesToDownload_1, file, err_1;
                                        var _this = this;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    _a.trys.push([0, 6, , 7]);
                                                    return [4 /*yield*/, axios(java.manifest.url)];
                                                case 1:
                                                    res_1 = _a.sent();
                                                    files = Object.keys(res_1.data.files).map(function (file) {
                                                        return {
                                                            name: file,
                                                            downloads: res_1.data.files[file].downloads,
                                                            type: res_1.data.files[file].type
                                                        };
                                                    });
                                                    directory = files.filter(function (file) { return file.type == "directory"; });
                                                    filesToDownload_2 = files.filter(function (file) { return file.type == "file"; });
                                                    javaDirs_1 = [this.minecraftDir, "flexberry-jre", javaVersionCode];
                                                    javaDirs_1.forEach(function (dir, i) {
                                                        var _dir = javaDirs_1.slice(0, i + 1).join(path.sep);
                                                        if (!fs.existsSync(_dir)) {
                                                            console.log("Creating directory: " + _dir);
                                                            win.webContents.send("progress", "Creating directory: " + _dir);
                                                            fs.mkdirSync(_dir);
                                                        }
                                                    });
                                                    console.time("createDir");
                                                    directory.forEach(function (dir) {
                                                        console.log("Creating directory: " + dir.name);
                                                        win.webContents.send("progress", "Creating directory: " + dir.name);
                                                        fs.mkdirSync(path.join(_this.minecraftDir, "flexberry-jre", javaVersionCode, dir.name));
                                                    });
                                                    console.timeEnd("createDir");
                                                    console.time("downloadFiles");
                                                    downloadedFiles_1 = 0;
                                                    _loop_1 = function (file) {
                                                        var download, stream;
                                                        return __generator(this, function (_b) {
                                                            switch (_b.label) {
                                                                case 0:
                                                                    win.webContents.send("progress", {
                                                                        type: "Java",
                                                                        task: downloadedFiles_1,
                                                                        total: filesToDownload_2.length
                                                                    });
                                                                    return [4 /*yield*/, axios.get(file.downloads["raw"].url, {
                                                                            responseType: "stream",
                                                                            timeout: 2147483647,
                                                                            httpsAgent: new https.Agent({ keepAlive: true })
                                                                        })];
                                                                case 1:
                                                                    download = _b.sent();
                                                                    stream = fs.createWriteStream(path.join(this_1.minecraftDir, "flexberry-jre", javaVersionCode, file.name));
                                                                    download.data.pipe(stream);
                                                                    stream.on("finish", function () {
                                                                        downloadedFiles_1++;
                                                                        win.webContents.send("progress", {
                                                                            type: "Java",
                                                                            task: downloadedFiles_1,
                                                                            total: filesToDownload_2.length
                                                                        });
                                                                        console.log(downloadedFiles_1 +
                                                                            " of " +
                                                                            filesToDownload_2.length +
                                                                            " files downloaded (" +
                                                                            file.name +
                                                                            ")");
                                                                        if (downloadedFiles_1 == filesToDownload_2.length) {
                                                                            console.timeEnd("downloadFiles");
                                                                            return resolve(javaPath);
                                                                        }
                                                                    });
                                                                    return [2 /*return*/];
                                                            }
                                                        });
                                                    };
                                                    this_1 = this;
                                                    _i = 0, filesToDownload_1 = filesToDownload_2;
                                                    _a.label = 2;
                                                case 2:
                                                    if (!(_i < filesToDownload_1.length)) return [3 /*break*/, 5];
                                                    file = filesToDownload_1[_i];
                                                    return [5 /*yield**/, _loop_1(file)];
                                                case 3:
                                                    _a.sent();
                                                    _a.label = 4;
                                                case 4:
                                                    _i++;
                                                    return [3 /*break*/, 2];
                                                case 5: return [3 /*break*/, 7];
                                                case 6:
                                                    err_1 = _a.sent();
                                                    console.log(err_1);
                                                    return [2 /*return*/, reject("Could not download java")];
                                                case 7: return [2 /*return*/];
                                            }
                                        });
                                    }); })["catch"](function (err) {
                                        console.log(err);
                                        return reject(err);
                                    });
                                }
                                return [2 /*return*/];
                            });
                        }); })];
                });
            });
        };
        GameManager.prototype.getCurrentAccount = function () {
            return __awaiter(this, void 0, void 0, function () {
                var selectedAccount;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, db.get("accounts").find({ isSelected: true }).value()];
                        case 1:
                            selectedAccount = _a.sent();
                            if (!selectedAccount)
                                return [2 /*return*/, null];
                            return [2 /*return*/, msmc.getMCLC().getAuth(selectedAccount.profile)];
                    }
                });
            });
        };
        GameManager.prototype.launch = function (arg) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                            var versionMetaURL, versionMeta, err_2, javaVersionCode, javaPath, err_3, launcher, version, launcherOptions;
                            var _a;
                            var _this = this;
                            var _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        versionMetaURL = arg.url || arg.actualVersion.url;
                                        versionMeta = {};
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, axios.get(versionMetaURL)];
                                    case 2:
                                        versionMeta = (_d.sent()).data;
                                        return [3 /*break*/, 4];
                                    case 3:
                                        err_2 = _d.sent();
                                        console.log(err_2);
                                        reject({
                                            code: 777,
                                            error: "Could not download version meta, skipping automatic java download"
                                        });
                                        return [3 /*break*/, 4];
                                    case 4:
                                        console.log(versionMeta);
                                        javaVersionCode = ((_b = versionMeta === null || versionMeta === void 0 ? void 0 : versionMeta.javaVersion) === null || _b === void 0 ? void 0 : _b.component) || "jre-legacy";
                                        _d.label = 5;
                                    case 5:
                                        _d.trys.push([5, 7, , 8]);
                                        return [4 /*yield*/, this.downloadJava(javaVersionCode)];
                                    case 6:
                                        javaPath = _d.sent();
                                        return [3 /*break*/, 8];
                                    case 7:
                                        err_3 = _d.sent();
                                        win.webContents.send("progress", "Could not download java, skipping automatic java download");
                                        reject({ code: 778, error: "Could not download java, " + err_3 });
                                        return [3 /*break*/, 8];
                                    case 8:
                                        console.log(javaPath);
                                        launcher = new Client();
                                        version = {
                                            number: ((_c = arg.actualVersion) === null || _c === void 0 ? void 0 : _c.id) || arg.id,
                                            type: arg.type
                                        };
                                        if (arg.actualVersion)
                                            version.custom = arg.id;
                                        console.log(version);
                                        _a = {
                                            clientPackage: null,
                                            root: this.minecraftDir,
                                            version: version
                                        };
                                        return [4 /*yield*/, this.getCurrentAccount()];
                                    case 9:
                                        launcherOptions = (_a.authorization = (_d.sent()) ||
                                            Authenticator.getAuth("flexberry" + Math.floor(Math.random() * 999) + 1),
                                            _a.memory = {
                                                max: arg.profile.memory + "M",
                                                min: arg.profile.memory + "M"
                                            },
                                            _a.overrides = {
                                                gameDirectory: arg.profile.dir || this.minecraftDir
                                            },
                                            _a);
                                        javaPath && (launcherOptions.javaPath = javaPath);
                                        launcher.on("progress", function (e) {
                                            win.webContents.send("progress", e);
                                        });
                                        return [4 /*yield*/, (0, promises_1.setTimeout)(1000)];
                                    case 10:
                                        _d.sent();
                                        launcher
                                            .launch(launcherOptions)
                                            .then(function () {
                                            console.log("LAUNCH -> PASS");
                                            _this.alreadyLaunched = true;
                                            resolve(launcher);
                                        })["catch"](function (err) {
                                            reject({
                                                code: 580,
                                                error: err
                                            });
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                });
            });
        };
        return GameManager;
    }());
    var Minecraft = new GameManager();
    ipcMain.on("launch", function (event, arg) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log(arg);
            win.webContents.send("launching", true);
            Minecraft.launch(arg)
                .then(function (instance) {
                win.webContents.send("progress", "Launching");
                instance.on("data", function (d) {
                    console.log("[Minecraft] ", d);
                    if (win.isVisible()) {
                        win.webContents.send("hideUi", true);
                        win.hide();
                    }
                });
                instance.on("close", function (d) {
                    console.log("Minecraft is closed: ", d);
                    if (!win.isVisible()) {
                        win.webContents.send("hideUi", false);
                        win.show();
                    }
                });
            })["catch"](function (err) {
                console.log(err);
            });
            return [2 /*return*/];
        });
    }); });
};
//# sourceMappingURL=gameManager.js.map