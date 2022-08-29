// TO-DO - organize this file
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a = require("electron"), ipcRenderer = _a.ipcRenderer, contextBridge = _a.contextBridge, ipcMain = _a.ipcMain;
var fs = require("fs");
var DiscordRPC = require("discord-rpc");
DiscordRPC.register("935845425599094824");
var rpc = new DiscordRPC.Client({ transport: "ipc" });
var startTimestamp = new Date();
rpc.setMaxListeners(0);
var mainDir = __dirname.split("\\scripts")[0];
mainDir = mainDir.includes("/scripts") ? mainDir.split("/scripts")[0] : mainDir;
function setActivity() {
    rpc.setActivity({
        details: "In main window",
        startTimestamp: startTimestamp,
        largeImageKey: "overhauled_logo",
        largeImageText: "Flexberry Launcher",
        instance: false
    });
    rpc.on("ready", function () {
        setActivity();
        console.log("[DEBUG] Discord RPC ready");
        setInterval(function () {
            setActivity();
        }, 15e3);
    });
}
function addEvent(type, element, event, loading) {
    var params = [];
    for (var _i = 4; _i < arguments.length; _i++) {
        params[_i - 4] = arguments[_i];
    }
    try {
        if (type == "id") {
            el = document.getElementById(element);
        }
        else {
            el = document.querySelector(element);
        }
        el.addEventListener("click", function () {
            if (loading)
                toggleLoading("accounts");
            event.apply(void 0, params);
        });
    }
    catch (_a) {
        return;
    }
}
function toggleLoading(tab, forceClose) {
    var tabEl = document.getElementById(tab);
    if (forceClose)
        return tabEl.classList.remove("tabLoading");
    tabEl.classList.toggle("tabLoading");
}
var wiz;
window.addEventListener("DOMContentLoaded", function () {
    function online() {
        document.querySelectorAll(".requiresConnection").forEach(function (el) {
            el.style.display = "";
        });
        document.querySelectorAll(".noConnectionIndicator").forEach(function (el) {
            el.style.display = "none";
        });
    }
    function noConnection() {
        document.querySelectorAll(".requiresConnection").forEach(function (el) {
            el.style.display = "none";
        });
        document.querySelectorAll(".noConnectionIndicator").forEach(function (el) {
            el.style.display = "";
        });
    }
    window.addEventListener("online", online);
    window.addEventListener("offline", noConnection);
    navigator.onLine ? online() : noConnection();
    ipcRenderer.send("getVersions");
    setActivity();
    ipcRenderer.send("loaded");
    addEvent("id", "login", ipcRenderer.send, true, "addAccount");
    ipcRenderer.send("getAccounts");
    ipcRenderer.send("getProfiles");
    wiz = document.getElementById("wizard").outerHTML.toString();
    fs.readdir(path.join(mainDir, "style", "themes"), function (err, files) {
        if (err)
            return console.error(err);
        var themes = files.filter(function (file) { return file.endsWith(".css"); });
        var theme = themes[Math.floor(Math.random() * themes.length)];
        var style = document.createElement("link");
        style.setAttribute("rel", "stylesheet");
        style.setAttribute("type", "text/css");
        style.setAttribute("href", "style/themes/".concat(theme));
        document.head.appendChild(style);
    });
});
rpc.login({ clientId: "935845425599094824" })["catch"](console.error);
var toggledSubTabs = [];
var toggledTabs = [];
ipcRenderer.on("loginResult", function (event, arg) {
    if (JSON.parse(arg).status == "error") {
        // TO-DO - add error handling (maybe a pop-up?)
        toggleLoading("accounts", true);
    }
    else {
        var accounts = JSON.parse(JSON.parse(arg).accounts); // yes, i hate processing JSON datas...
        createAccountList(accounts, arg.haveSelected);
    }
});
ipcRenderer.on("verifyAccountResult", function (event, arg) {
    arg = JSON.parse(arg);
    if (arg.error) {
        // TO-DO - add error handling (maybe a pop-up?)
        toggleLoading("accounts", true);
        return console.error(arg);
    }
    if (!arg.valid) {
        ipcRenderer.send("refreshAccount", arg.uuid);
        return;
    }
    ipcRenderer.send("setSelectedAccount", arg.uuid);
});
ipcRenderer.on("refreshAccountResult", function (event, arg) {
    toggleLoading("accounts");
    arg = JSON.parse(arg);
    if (arg.error || !arg.accounts) {
        // TO-DO - add error handling (maybe a pop-up?)
        return console.error(arg);
    }
    ipcRenderer.send("setSelectedAccount", arg.uuid);
});
var versions = [];
ipcRenderer.on("versions", function (event, arg) {
    versions = arg;
});
Date.prototype.toShortFormat = function () {
    var monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    var day = this.getDate();
    var monthIndex = this.getMonth();
    var monthName = monthNames[monthIndex];
    var year = this.getFullYear();
    return "".concat(day, " ").concat(monthName, " ").concat(year);
};
function drawVersions() {
    var checked = document.getElementsByClassName("checked versionType");
    var filter = __spreadArray([], checked, true).map(function (el) { return el.id; });
    var els = [];
    versions
        .filter(function (version) {
        return filter.includes(version.type);
    })
        .forEach(function (version) {
        var optionEl = document.createElement("div");
        optionEl.id = version.id.split(" ").join("") + Date.now();
        optionEl.classList.add("option", "version");
        var optionTextEl = document.createElement("span");
        optionTextEl.classList.add("optionText");
        var formattedDate = new Date(version.actualReleaseTime || version.releaseTime).toShortFormat();
        optionTextEl.innerHTML = version.id;
        var optionAltEl = document.createElement("span");
        optionAltEl.classList.add("optionAlt");
        optionAltEl.innerHTML = formattedDate;
        optionEl.appendChild(optionTextEl);
        optionEl.appendChild(optionAltEl);
        els.push(optionEl);
    });
    var vers = document.getElementById("versions");
    vers.innerHTML = els.map(function (el) { return el.outerHTML; }).join("");
    els.forEach(function (el) {
        addEvent("id", el.id, selectVersion, false, el.id);
    });
    !wiz && (wiz = document.getElementById("wizard").outerHTML.toString());
}
function selectVersion(versionId) {
    var versionEl = document.getElementById(versionId);
    var version = versions.find(function (version) {
        return version.id ==
            versionEl.innerText
                .replace(new Date(version.actualReleaseTime || version.releaseTime).toShortFormat(), "")
                .trim();
    });
    if (!version)
        return;
    console.log(version);
    var versionEls = document.querySelectorAll(".version");
    console.log(version);
    for (var i = 0; i < versionEls.length; i++) {
        versionEls[i].classList.remove("selectedVersionSE");
    }
    versionEl.classList.add("selectedVersionSE");
    wizard.version = version.id;
    wizard.type == version.type || "unknown";
}
function check(id, fn) {
    if (fn == "drawVersions" &&
        document.getElementsByClassName("checked versionType").length == 1 &&
        document.getElementById(id).classList.contains("checked"))
        return;
    var check = document.getElementById(id);
    check.classList.toggle("checked");
    setTimeout(function () {
        // 10 ms delay to avoid flickering. if you've saw that, screenshot it and send it to our Discord server https://discord.gg/Mrt8HFmwne
        eval(fn + "()");
    }, 6.9 + 3.1);
}
function createAccountList(accounts, selected) {
    try {
        var tbs_1 = [];
        console.log("[DEBUG] Creating account list");
        var listEl_1 = document.querySelector("#accountList");
        listEl_1.innerHTML = "";
        var loginEl = document.createElement("div");
        loginEl.classList.add("addAccount");
        loginEl.classList.add("account");
        loginEl.classList.add("requiresConnection");
        loginEl.setAttribute("id", "login");
        var loginIconEl = document.createElement("img");
        loginIconEl.classList.add("addAccountIcon");
        loginIconEl.setAttribute("src", "assets/images/microsoft.png");
        var loginTitleEl = document.createElement("span");
        loginTitleEl.classList.add("addAccountTitle");
        loginTitleEl.innerHTML = "Login with Microsoft";
        loginEl.appendChild(loginIconEl);
        loginEl.appendChild(loginTitleEl);
        listEl_1.appendChild(loginEl);
        addEvent("id", "login", ipcRenderer.send, true, "addAccount");
        accounts.forEach(function (account) {
            var accountEl = document.createElement("div");
            accountEl.classList.add("account");
            accountEl.classList.add("requiresConnection");
            account.isSelected && accountEl.classList.add("selectedAccount");
            account.isSelected && (selectedAccount = account);
            accountEl.setAttribute("id", account.uuid);
            var accountMainEl = document.createElement("div");
            accountMainEl.classList.add("accountMain");
            var accountImageEl = document.createElement("img");
            accountImageEl.classList.add("accountImage");
            // TO-DO - change image provider, this one has caching issues
            accountImageEl.setAttribute("src", "https://visage.surgeplay.com/face/44/".concat(account.profile.id));
            var accountInfoEl = document.createElement("div");
            accountInfoEl.classList.add("accountInfo");
            var accountUsernameEl = document.createElement("span");
            accountUsernameEl.classList.add("accountUsername");
            accountUsernameEl.innerHTML = account.profile.name;
            var accountMailEl = document.createElement("span");
            accountMailEl.classList.add("accountMail");
            accountMailEl.innerHTML = account.xbox.name + " on Xbox ";
            accountInfoEl.appendChild(accountUsernameEl);
            accountInfoEl.appendChild(accountMailEl);
            accountMainEl.appendChild(accountImageEl);
            accountMainEl.appendChild(accountInfoEl);
            accountEl.appendChild(accountMainEl);
            var deleteAccountEl = document.createElement("div");
            deleteAccountEl.classList.add("deleteAccount");
            deleteAccountEl.setAttribute("id", "trash-" + account.uuid);
            accountEl.appendChild(deleteAccountEl);
            listEl_1.appendChild(accountEl);
            !account.isSelected &&
                addEvent("id", account.uuid, ipcRenderer.send, true, "verifyAccount", account.uuid);
            addEvent("id", "trash-" + account.uuid, ipcRenderer.send, true, "deleteAccount", account.uuid);
            account.isSelected && tbs_1.push(account);
        });
        if (selected)
            tbs_1 = [];
        setSelectedAccount(tbs_1[0]);
    }
    catch (_a) {
        return;
    }
}
function setSelectedAccount(account) {
    try {
        toggleLoading("accounts", true);
        selectedAccount = {};
        if (account)
            selectedAccount = account;
        var toBePlaced = account ? account.profile.name : "Not logged in";
        document.getElementById("username").innerHTML = toBePlaced;
    }
    catch (_a) {
        return;
    }
}
function toggleTab(tabName, stayOnCurrent) {
    if (!tabName)
        tabName = toggledTabs[0];
    var toggler1 = !stayOnCurrent ? document.getElementById(tabName + "Toggler") : undefined;
    var toggler2 = !stayOnCurrent ? document.getElementById(toggledTabs[0] + "Toggler") : undefined;
    if (!toggledTabs[0]) {
        document.getElementById(tabName).classList.add("visibleTab");
        toggler1 && toggler1.classList.add("toggledButton");
        toggledTabs.push(tabName);
    }
    else if (toggledTabs[0] == tabName) {
        document.getElementById(tabName).classList.remove("visibleTab");
        toggler1 && toggler1.classList.remove("toggledButton");
        toggledTabs.shift();
    }
    else {
        document.getElementById(toggledTabs[0]).classList.remove("visibleTab");
        toggler2 && toggler2.classList.remove("toggledButton");
        document.getElementById(tabName).classList.add("visibleTab");
        toggler1 && toggler1.classList.add("toggledButton");
        if (!stayOnCurrent)
            toggledTabs[0] = tabName;
    }
    if (!stayOnCurrent)
        rpc.setActivity({
            details: "In " + (toggledTabs[0] ? tabName + " tab" : "the main menu"),
            startTimestamp: startTimestamp,
            largeImageKey: "overhauled_logo",
            largeImageText: "Flexberry Launcher",
            instance: false
        });
}
function toggleSubTab(tabName) {
    if (!tabName)
        tabName = toggledSubTabs[0];
    if (!toggledSubTabs[0]) {
        document.getElementById(tabName).classList.add("visibleSubTab");
        document.getElementById(tabName + "Toggler").classList.add("toggledTabToggler");
        toggledSubTabs.push(tabName);
    }
    else if (toggledSubTabs[0] == tabName) {
        return;
    }
    else {
        document.getElementById(toggledSubTabs[0]).classList.remove("visibleSubTab");
        document.getElementById(toggledSubTabs[0] + "Toggler").classList.remove("toggledTabToggler");
        document.getElementById(tabName).classList.add("visibleSubTab");
        document.getElementById(tabName + "Toggler").classList.add("toggledTabToggler");
        toggledSubTabs[0] = tabName;
    }
}
// version mgmt
function openVersionSelect() {
    document.getElementById("wizardAction").innerHTML = "Next";
    clearObject(wizard);
    wizard.appearance.icon = "glass";
    document.getElementById("versionSelect").classList.add("visibleModal");
    document.getElementById("versionSelectWrapper").classList.add("visibleModalWrapper");
    document.getElementById("wizard").outerHTML = wiz;
    drawVersions();
}
function closeVersionSelect() {
    document.getElementById("versionSelect").classList.remove("visibleModal");
    document.getElementById("versionSelectWrapper").classList.remove("visibleModalWrapper");
}
var launchOptions = {};
function createProfileList(profiles) {
    console.log(profiles);
    var selected = profiles.find(function (profile) { return profile.isSelected; });
    if (!selected) {
        if (profiles[0]) {
            ipcRenderer.send("selectProfile", profiles[0].uuid);
            selected = profiles[0];
        }
    }
    document.getElementById("ver").innerHTML = selected.appearance.name;
    launchOptions = versions.find(function (version) { return version.id == selected.version; });
    launchOptions.profile = selected;
    try {
        var tbs_2 = [];
        console.log("[DEBUG] Creating profile list");
        var listEl_2 = document.querySelector("#versionList");
        listEl_2.innerHTML = "";
        var loginEl = document.createElement("div");
        loginEl.classList.add("addVersion", "version");
        loginEl.setAttribute("id", "addVersion");
        var loginIconEl = document.createElement("span");
        loginIconEl.classList.add("addVersionIcon");
        loginIconEl.innerHTML = "+";
        var loginTitleEl = document.createElement("span");
        loginTitleEl.classList.add("addVersionTitle");
        loginTitleEl.innerHTML = "Add version";
        loginEl.appendChild(loginIconEl);
        loginEl.appendChild(loginTitleEl);
        listEl_2.appendChild(loginEl);
        addEvent("id", "addVersion", openVersionSelect, false);
        profiles.forEach(function (account) {
            var accountEl = document.createElement("div");
            accountEl.classList.add("version");
            account.isSelected && accountEl.classList.add("selectedVersion");
            account.isSelected && (selectedAccount = account);
            accountEl.setAttribute("id", account.acronym);
            var accountMainEl = document.createElement("div");
            accountMainEl.classList.add("versionMain");
            var accountImageEl = document.createElement("img");
            accountImageEl.classList.add("versionImage");
            accountImageEl.setAttribute("src", "assets/blocks/".concat(account.appearance.icon, ".png"));
            var accountInfoEl = document.createElement("div");
            accountInfoEl.classList.add("versionInfo");
            var accountUsernameEl = document.createElement("span");
            accountUsernameEl.classList.add("versionName");
            accountUsernameEl.innerHTML = account.appearance.name;
            var accountMailEl = document.createElement("span");
            accountMailEl.classList.add("versionVersion");
            accountMailEl.innerHTML = account.version;
            accountInfoEl.appendChild(accountUsernameEl);
            accountInfoEl.appendChild(accountMailEl);
            accountMainEl.appendChild(accountImageEl);
            accountMainEl.appendChild(accountInfoEl);
            accountEl.appendChild(accountMainEl);
            var deleteAccountEl = document.createElement("div");
            deleteAccountEl.classList.add("deleteVersion");
            deleteAccountEl.setAttribute("id", "trash-" + account.acronym);
            accountEl.appendChild(deleteAccountEl);
            listEl_2.appendChild(accountEl);
            !account.isSelected &&
                addEvent("id", account.acronym, ipcRenderer.send, false, "selectProfile", account.appearance.name);
            addEvent("id", "trash-" + account.acronym, ipcRenderer.send, false, "deleteProfile", account.appearance.name);
            account.isSelected && tbs_2.push(account);
        });
        if (selected)
            tbs_2 = [];
        setSelectedVersion(tbs_2[0]);
    }
    catch (_a) {
        return;
    }
}
var alreadyCycling = false;
var wizard = {
    appearance: {}
};
function clearObject(object) {
    var temp = {};
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            if (typeof object[key] === "object") {
                temp[key] = clearObject(object[key]);
            }
            else {
                temp[key] = null;
            }
        }
    }
    return temp;
}
function wizardCycle() {
    if (alreadyCycling)
        return;
    var wizardEl = document.getElementById("wizard");
    var page = Math.round((wizardEl.scrollLeft - 17 * Math.floor(wizardEl.scrollLeft / wizardEl.offsetWidth)) /
        wizardEl.offsetWidth) + 1;
    var wizardAction = document.getElementById("wizardAction");
    if (page == 1) {
        wizard.appearance.name =
            document.getElementById("profileName").value ||
                "Unnamed Profile " + Math.floor(Math.random() * 999) + 1;
        wizardAction.innerHTML = "Add profile";
    }
    else if (page == 2) {
        if (document.querySelector(".selectedVersionSE")) {
            ipcRenderer.send("addProfile", wizard);
            closeVersionSelect();
        }
        else {
            wizardAction.innerHTML = "Select a version";
            setTimeout(function () {
                wizardAction.innerHTML = "Add profile";
            }, 1000);
            return;
        }
    }
    wizardEl.scrollBy(wizardEl.offsetWidth + 17, 0);
    alreadyCycling = true;
    console.log(wizard);
    setTimeout(function () {
        alreadyCycling = false;
    }, 400);
}
ipcRenderer.on("profiles", function (event, arg) {
    createProfileList(arg);
});
function selectIcon(id) {
    wizard.appearance.icon = id;
    var icon = document.getElementById(id);
    var blocks = document.querySelectorAll(".selectedBlock");
    for (var i = 0; i < blocks.length; i++) {
        blocks[i].classList.remove("selectedBlock");
    }
    icon.classList.add("selectedBlock");
}
function launch() {
    console.log(launchOptions);
    ipcRenderer.send("launch", launchOptions);
}
ipcRenderer.on("launched", function (event, arg) {
    if (!arg) {
        document.body.classList.remove("loaded");
    }
    else {
        document.getElementById("progress").innerText = "";
    }
});
ipcRenderer.on("hideUi", function (event, arg) {
    if (!arg) {
        document.body.classList.remove("loaded");
        document.getElementsByClassName("progress")[0].style.opacity = "1";
    }
    else {
        document.body.classList.add("loaded");
        document.getElementsByClassName("progress")[0].style.opacity = "1";
    }
});
ipcRenderer.on("progress", function (event, arg) {
    console.log("PROGRESS");
    console.log(event, arg);
    document.getElementById("progress").innerText =
        arg instanceof Object
            ? "Downloading ".concat(arg.type, " ").concat(Math.round((arg.task / arg.total) * 100), "%")
            : arg;
});
ipcRenderer.on("updateAvailable", function (event, arg) {
    document.getElementsByClassName("progress")[0].innerText = "Downloading new version ".concat(arg.version, " with size of ").concat((arg.size / 1024).toFixed(1), " KB");
    setTimeout(function () {
        ipcRenderer.send("update", arg.url);
    }, 3000);
});
ipcRenderer.on("updateError", function (event, arg) {
    console.log(arg);
    document.getElementsByClassName("progress")[0].innerText = "\nError downloading the update. Please restart the launcher.";
});
ipcRenderer.on("updateProgress", function (event, arg) {
    document.getElementsByClassName("progress")[0].innerText = arg;
});
contextBridge.exposeInMainWorld("check", check);
contextBridge.exposeInMainWorld("toggleSubTab", toggleSubTab);
contextBridge.exposeInMainWorld("wizardCycle", wizardCycle);
contextBridge.exposeInMainWorld("selectIcon", selectIcon);
contextBridge.exposeInMainWorld("toggleTab", toggleTab);
contextBridge.exposeInMainWorld("closeVersionSelect", closeVersionSelect);
contextBridge.exposeInMainWorld("selectVersion", selectVersion);
contextBridge.exposeInMainWorld("launch", launch);
s;
//# sourceMappingURL=preload.js.map