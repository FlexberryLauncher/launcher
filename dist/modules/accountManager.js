// TO-DO - C L E A N     T H I S     C O D E
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
var _this = this;
function setup() {
    return __awaiter(this, void 0, void 0, function () {
        var selectedAccount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db.defaults({ accounts: [] }).write()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, db.get("accounts").find({ isSelected: true }).value()];
                case 2:
                    selectedAccount = _a.sent();
                    if (selectedAccount && !msmc.validate(selectedAccount.profile)) {
                        console.log("[MANAGERS => ACCOUNT MANAGER] Deselecting selected account, because it's expired.");
                        db.get("accounts").find({ isSelected: true }).assign({ isSelected: false }).write();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
setup();
ipcMain.on("addAccount", function (event) {
    msmc
        .fastLaunch("electron", function (update) {
        console.log((update.percent || 0) + "% - Logging in...");
    }, undefined, {
        resizable: false,
        fullscreenable: false,
        width: 520,
        height: 700,
        titleBarStyle: "hidden",
        skipTaskbar: true,
        alwaysOnTop: true,
        icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.png")
    })
        .then(function (result) { return __awaiter(_this, void 0, void 0, function () {
        var xbox, accs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (msmc.errorCheck(result)) {
                        console.log("Error logging in:", result.reason);
                        event.reply("loginResult", JSON.stringify({ status: "error", error: result.reason }));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, db.get("accounts").find({ uuid: result.profile.id }).value()];
                case 1:
                    if (!_a.sent()) return [3 /*break*/, 2];
                    console.log("Account already exists");
                    event.reply("loginResult", JSON.stringify({ status: "error", error: "Account already exists" }));
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, result.getXbox()];
                case 3:
                    xbox = _a.sent();
                    newData = {
                        uuid: result.profile.id,
                        access_token: result.access_token,
                        profile: result.profile,
                        xbox: xbox,
                        isSelected: false
                    };
                    return [4 /*yield*/, db.get("accounts").push(newData).write()];
                case 4:
                    accs = _a.sent();
                    event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); })["catch"](function (reason) {
        console.log("Error logging in:", reason);
        event.reply("loginResult", JSON.stringify({ status: "error", error: reason }));
    });
});
ipcMain.on("verifyAccount", function (event, uuid) { return __awaiter(_this, void 0, void 0, function () {
    var profileObject, isValid;
    return __generator(this, function (_a) {
        console.log("[IPC] verifyAccount");
        profileObject = db.get("accounts").find({ uuid: uuid }).value();
        if (!profileObject)
            return [2 /*return*/, event.reply("verifyAccountResult", JSON.stringify({ status: "error", error: "Account not found" }))];
        isValid = msmc.validate(profileObject.profile);
        event.reply("verifyAccountResult", JSON.stringify({ status: "success", valid: isValid, uuid: uuid }));
        console.log("[IPC] |-> " + isValid);
        return [2 /*return*/];
    });
}); });
ipcMain.on("setSelectedAccount", function (event, uuid) { return __awaiter(_this, void 0, void 0, function () {
    var accs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("[IPC] setSelected");
                return [4 /*yield*/, db.get("accounts").find({ isSelected: true }).assign({ isSelected: false }).write()];
            case 1:
                _a.sent();
                return [4 /*yield*/, db.get("accounts").find({ uuid: uuid }).assign({ isSelected: true }).write()];
            case 2:
                _a.sent();
                return [4 /*yield*/, db.get("accounts").value()];
            case 3:
                accs = _a.sent();
                event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
                return [2 /*return*/];
        }
    });
}); });
ipcMain.on("refreshAccount", function (event, uuid) { return __awaiter(_this, void 0, void 0, function () {
    var profileObject;
    var _this = this;
    return __generator(this, function (_a) {
        console.log("[IPC] refreshAccount");
        profileObject = db.get("accounts").find({ uuid: uuid }).value();
        if (!profileObject)
            return [2 /*return*/, event.reply("refreshAccountResult", JSON.stringify({ status: "error", error: "Account not found" }))];
        msmc
            .refresh(profileObject.profile)
            .then(function (result) { return __awaiter(_this, void 0, void 0, function () {
            var profile, accounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        profile = result.profile;
                        return [4 /*yield*/, db.get("accounts").find({ uuid: uuid }).assign({ profile: profile }).write()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, db.get("accounts").value()];
                    case 2:
                        accounts = _a.sent();
                        return [2 /*return*/, event.reply("refreshAccountResult", JSON.stringify({ status: "success", valid: false, uuid: uuid, accounts: accounts }))];
                }
            });
        }); })["catch"](function (reason) {
            return event.reply("refreshAccountResult", JSON.stringify({ status: "error", error: reason }));
        });
        return [2 /*return*/];
    });
}); });
ipcMain.on("getAccounts", function (event) { return __awaiter(_this, void 0, void 0, function () {
    var accs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.get("accounts").value()];
            case 1:
                accs = _a.sent();
                event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
                return [2 /*return*/];
        }
    });
}); });
ipcMain.on("deleteAccount", function (event, data) { return __awaiter(_this, void 0, void 0, function () {
    var accs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, db.get("accounts").value()];
            case 1:
                accs = _a.sent();
                return [4 /*yield*/, db.get("accounts").find({ uuid: data }).value()];
            case 2:
                if (!(_a.sent()).isSelected) return [3 /*break*/, 6];
                return [4 /*yield*/, db.get("accounts").remove({ uuid: data }).write()];
            case 3:
                _a.sent();
                if (!accs[0]) return [3 /*break*/, 5];
                return [4 /*yield*/, db.get("accounts").first().assign({ isSelected: true }).write()];
            case 4:
                _a.sent();
                return [3 /*break*/, 6];
            case 5:
                console.log("DELETE [ELSE] >> No accounts left");
                return [2 /*return*/, event.reply("loginResult", JSON.stringify({
                        status: "success",
                        accounts: JSON.stringify(accs),
                        haveSelected: false
                    }))];
            case 6:
                event.reply("loginResult", JSON.stringify({
                    status: "success",
                    accounts: JSON.stringify(accs),
                    haveSelected: true
                }));
                return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=accountManager.js.map