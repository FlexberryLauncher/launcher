// TO-DO - organize this file

const { ipcRenderer, contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");
const DiscordRPC = require("discord-rpc");

DiscordRPC.register("935845425599094824");

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

rpc.setMaxListeners(0);

let mainDir = (__dirname).split("\\scripts")[0];
mainDir = mainDir.includes("/scripts") ? mainDir.split("/scripts")[0] : mainDir;

function setActivity() {
  rpc.setActivity({
    details: 'In main window',
    startTimestamp,
    largeImageKey: 'overhauled_logo',
    largeImageText: 'Flexberry Launcher',
    instance: false,
  });

  rpc.on('ready', () => {
    setActivity();
    console.log("[DEBUG] Discord RPC ready");
    setInterval(() => {
      setActivity();
    }, 15e3);
  });
}

function addEvent(type, element, event, loading, ...params) {
  try {
    if (type == "id") { 
      el = document.getElementById(element);
    } else {
      el = document.querySelector(element);
    }
    el.addEventListener("click", () => {
      if (loading)
        toggleLoading("accounts");
      event(...params);
    });
  } catch {
    return;
  }
}

function toggleLoading(tab, forceClose) {
  let tabEl = document.getElementById(tab);
  if (forceClose)
    return tabEl.classList.remove("tabLoading");
  tabEl.classList.toggle("tabLoading");
}

let wiz;

window.addEventListener("DOMContentLoaded", () => {
  function online() {
    document.querySelectorAll(".requiresConnection").forEach((el) => {
      el.style.display = "";
    });
    document.querySelectorAll(".noConnectionIndicator").forEach((el) => {
      el.style.display = "none";
    });
  }
  function noConnection() {
    document.querySelectorAll(".requiresConnection").forEach((el) => {
      el.style.display = "none";
    });
    document.querySelectorAll(".noConnectionIndicator").forEach((el) => {
      el.style.display = "";
    });
  }
  window.addEventListener('online', online);
  window.addEventListener('offline', noConnection);
  navigator.onLine ? online() : noConnection();
  ipcRenderer.send("getVersions");
  setActivity();
  ipcRenderer.send("loaded");
  addEvent("id", "login", ipcRenderer.send, true, "addAccount");
  ipcRenderer.send("getAccounts");
  ipcRenderer.send("getProfiles");
  wiz = document.getElementById("wizard").outerHTML.toString();
  fs.readdir(path.join(mainDir, "style", "themes"), (err, files) => {
    if (err) return console.error(err);
    const themes = files.filter(file => file.endsWith(".css"));
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("type", "text/css");
    style.setAttribute("href", `style/themes/${theme}`);
    document.head.appendChild(style);
  });
});

rpc.login({ "clientId": "935845425599094824" }).catch(console.error);

let toggledSubTabs = [];
let toggledTabs = [];

ipcRenderer.on("loginResult", (event, arg) => {
  if (JSON.parse(arg).status == "error") {
    // TO-DO - add error handling (maybe a pop-up?)
    toggleLoading("accounts", true);
  } else {
    const accounts = JSON.parse(JSON.parse(arg).accounts); // yes, i hate processing JSON datas...
    createAccountList(accounts, arg.haveSelected);
  }
});

ipcRenderer.on("verifyAccountResult", (event, arg) => {
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

ipcRenderer.on("refreshAccountResult", (event, arg) => {
  toggleLoading("accounts");
  arg = JSON.parse(arg);
  if (arg.error || !arg.accounts) {
    // TO-DO - add error handling (maybe a pop-up?)
    return console.error(arg);
  }
  ipcRenderer.send("setSelectedAccount", arg.uuid);
})

let versions = [];

ipcRenderer.on("versions", (event, arg) => {
  versions = arg;
});

Date.prototype.toShortFormat = function() {

  let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  let day = this.getDate();
  
  let monthIndex = this.getMonth();
  let monthName = monthNames[monthIndex];
  
  let year = this.getFullYear();
  
  return `${day} ${monthName} ${year}`;  
}

function drawVersions() {
  const checked = document.getElementsByClassName("checked versionType");
  const filter = [...checked].map(el => el.id);
  const els = [];
  versions.filter(version => {
    return filter.includes(version.type);
  }).forEach(version => {
    const optionEl = document.createElement("div");
    optionEl.id = version.id.split(" ").join("");
    optionEl.classList.add("option");
    optionEl.classList.add("version");
    const optionTextEl = document.createElement("span");
    optionTextEl.classList.add("optionText");
    const formattedDate = (new Date(version.actualReleaseTime || version.releaseTime)).toShortFormat(); 
    optionTextEl.innerHTML = version.id;
    const optionAltEl = document.createElement("span");
    optionAltEl.classList.add("optionAlt");
    optionAltEl.innerHTML = formattedDate;
    optionEl.appendChild(optionTextEl);
    optionEl.appendChild(optionAltEl);
    els.push(optionEl);
  });
  const vers = document.getElementById("versions");
  vers.innerHTML = els.map(el => el.outerHTML).join("");
  els.forEach(el => {
    addEvent("id", el.id, selectVersion, false, el.id);
  });
  !wiz && (wiz = document.getElementById("wizard").outerHTML.toString());
}

function selectVersion(versionId) {
  const versionEl = document.getElementById(versionId);
  const version = versions.find(version => version.id == versionEl.innerText.replace((new Date(version.actualReleaseTime || version.releaseTime)).toShortFormat(), "").trim());
  if (!version) return;
  console.log(version);
  const versionEls = document.querySelectorAll(".version");
  console.log(version);
  for (let i = 0; i < versionEls.length; i++) {
    versionEls[i].classList.remove("selectedVersionSE");
  }
  versionEl.classList.add("selectedVersionSE");
  wizard.version = version.id;
  wizard.type == version.type || "unknown";
}

function check(id, fn) {
  if (fn == "drawVersions" && document.getElementsByClassName("checked versionType").length == 1 && (document.getElementById(id).classList.contains("checked")))
    return;
  const check = document.getElementById(id);
  check.classList.toggle("checked");
  setTimeout(() => {
    // 10 ms delay to avoid flickering. if you've saw that, screenshot it and send it to our Discord server https://discord.gg/Mrt8HFmwne
    eval(fn + "()");
  }, 6.9 + 3.1);
}

function createAccountList(accounts, selected) {
  try {
    let tbs = [];
    console.log("[DEBUG] Creating account list");
    const listEl = document.querySelector("#accountList");
    listEl.innerHTML = "";
    const loginEl = document.createElement("div");
    loginEl.classList.add("addAccount");
    loginEl.classList.add("account");
    loginEl.classList.add("requiresConnection");
    loginEl.setAttribute("id", "login");
    const loginIconEl = document.createElement("img");
    loginIconEl.classList.add("addAccountIcon");
    loginIconEl.setAttribute("src", "assets/images/microsoft.png");
    const loginTitleEl = document.createElement("span");
    loginTitleEl.classList.add("addAccountTitle");
    loginTitleEl.innerHTML = "Login with Microsoft";
    loginEl.appendChild(loginIconEl);
    loginEl.appendChild(loginTitleEl);
    listEl.appendChild(loginEl);
    addEvent("id", "login", ipcRenderer.send, true, "addAccount");
    accounts.forEach(account => {
      const accountEl = document.createElement("div");
      accountEl.classList.add("account");
      accountEl.classList.add("requiresConnection");
      account.isSelected && accountEl.classList.add("selectedAccount");
      account.isSelected && (selectedAccount = account);
      accountEl.setAttribute("id", account.uuid);
      const accountMainEl = document.createElement("div");
      accountMainEl.classList.add("accountMain");
      const accountImageEl = document.createElement("img");
      accountImageEl.classList.add("accountImage");
      // TO-DO - change image provider, this one has caching issues
      accountImageEl.setAttribute("src", `https://visage.surgeplay.com/face/44/${account.profile.id}`);
      const accountInfoEl = document.createElement("div");
      accountInfoEl.classList.add("accountInfo");
      const accountUsernameEl = document.createElement("span");
      accountUsernameEl.classList.add("accountUsername");
      accountUsernameEl.innerHTML = account.profile.name;
      const accountMailEl = document.createElement("span");
      accountMailEl.classList.add("accountMail");
      accountMailEl.innerHTML = account.xbox.name + " on Xbox ";
      accountInfoEl.appendChild(accountUsernameEl);
      accountInfoEl.appendChild(accountMailEl);
      accountMainEl.appendChild(accountImageEl);
      accountMainEl.appendChild(accountInfoEl);
      accountEl.appendChild(accountMainEl);
      const deleteAccountEl = document.createElement("div");
      deleteAccountEl.classList.add("deleteAccount");
      deleteAccountEl.setAttribute("id", "trash-" + account.uuid);
      accountEl.appendChild(deleteAccountEl);
      listEl.appendChild(accountEl);
      !account.isSelected && addEvent("id", account.uuid, ipcRenderer.send, true, "verifyAccount", account.uuid);
      addEvent("id", "trash-"+account.uuid, ipcRenderer.send, true, "deleteAccount", account.uuid);
      account.isSelected && tbs.push(account);
    });
    if (selected)
    tbs = [];
    setSelectedAccount(tbs[0]);
  } catch {
    return;
  }
}

function setSelectedAccount(account) {
  try {
    toggleLoading("accounts", true);
    selectedAccount = {};
    if (account)
      selectedAccount = account;
    let toBePlaced = account ? account.profile.name : "Not logged in";
    document.getElementById("username").innerHTML = toBePlaced;
  } catch {
    return;
  }
}

function toggleTab(tabName, stayOnCurrent) {
  if (!tabName) 
    tabName = toggledTabs[0];
  let toggler1 = !stayOnCurrent ? document.getElementById(tabName + "Toggler") : undefined;
  let toggler2 = !stayOnCurrent ? document.getElementById(toggledTabs[0] + "Toggler") : undefined;
  if (!toggledTabs[0]) {
    document.getElementById(tabName).classList.add("visibleTab");
    toggler1 && toggler1.classList.add("toggledButton");
    toggledTabs.push(tabName);
  } else if (toggledTabs[0] == tabName) {
    document.getElementById(tabName).classList.remove("visibleTab");
    toggler1 && toggler1.classList.remove("toggledButton");
    toggledTabs.shift();
  } else {
    document.getElementById(toggledTabs[0]).classList.remove("visibleTab");
    toggler2 && toggler2.classList.remove("toggledButton");
    document.getElementById(tabName).classList.add("visibleTab");
    toggler1 && toggler1.classList.add("toggledButton");
    if (!stayOnCurrent)
      toggledTabs[0] = tabName;
  }
  if (!stayOnCurrent)
    rpc.setActivity({
      details: 'In ' + (toggledTabs[0] ? (tabName + ' tab') : 'the main menu'),
      startTimestamp,
      largeImageKey: 'overhauled_logo',
      largeImageText: 'Flexberry Launcher',
      instance: false,
    });
}

function toggleSubTab(tabName) {
  if (!tabName)
    tabName = toggledSubTabs[0];
  if (!toggledSubTabs[0]) {
    document.getElementById(tabName).classList.add("visibleSubTab");
    document.getElementById(tabName + "Toggler").classList.add("toggledTabToggler");
    toggledSubTabs.push(tabName);
  } else if (toggledSubTabs[0] == tabName) {
    return
  } else {
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
  document.getElementById("versionSelect").classList.add("visibleModal");
  document.getElementById("versionSelectWrapper").classList.add("visibleModalWrapper");
  document.getElementById("wizard").outerHTML = wiz;
  drawVersions();
}

function closeVersionSelect() {
  document.getElementById("versionSelect").classList.remove("visibleModal");
  document.getElementById("versionSelectWrapper").classList.remove("visibleModalWrapper");
}

let launchOptions = {};

function createProfileList(profiles) {
  console.log(profiles);
  let selected = profiles.find(profile => profile.isSelected);
  if (!selected) {
    if (profiles[0]) {
      ipcRenderer.send("selectProfile", profiles[0].uuid);
      selected = profiles[0];
    }
  }
  document.getElementById("ver").innerHTML = selected.appearance.name;
  launchOptions = versions.find(version => version.id == selected.version);
  launchOptions.profile = selected;
  try {
    let tbs = [];
    console.log("[DEBUG] Creating profile list");
    const listEl = document.querySelector("#versionList");
    listEl.innerHTML = "";
    const loginEl = document.createElement("div");
    loginEl.classList.add("addVersion");
    loginEl.classList.add("version");
    loginEl.setAttribute("id", "addVersion");
    const loginIconEl = document.createElement("span");
    loginIconEl.classList.add("addVersionIcon");
    loginIconEl.innerHTML = "+";
    const loginTitleEl = document.createElement("span");
    loginTitleEl.classList.add("addVersionTitle");
    loginTitleEl.innerHTML = "Add version";
    loginEl.appendChild(loginIconEl);
    loginEl.appendChild(loginTitleEl);
    listEl.appendChild(loginEl);
    addEvent("id", "addVersion", openVersionSelect, false);
    profiles.forEach(account => {
      const accountEl = document.createElement("div");
      accountEl.classList.add("version");
      account.isSelected && accountEl.classList.add("selectedVersion");
      account.isSelected && (selectedAccount = account);
      accountEl.setAttribute("id", account.acronym);
      const accountMainEl = document.createElement("div");
      accountMainEl.classList.add("versionMain");
      const accountImageEl = document.createElement("img");
      accountImageEl.classList.add("versionImage");
      accountImageEl.setAttribute("src", `assets/blocks/${account.appearance.icon}.png`);
      const accountInfoEl = document.createElement("div");
      accountInfoEl.classList.add("versionInfo");
      const accountUsernameEl = document.createElement("span");
      accountUsernameEl.classList.add("versionName");
      accountUsernameEl.innerHTML = account.appearance.name;
      const accountMailEl = document.createElement("span");
      accountMailEl.classList.add("versionVersion");
      accountMailEl.innerHTML = account.version;
      accountInfoEl.appendChild(accountUsernameEl);
      accountInfoEl.appendChild(accountMailEl);
      accountMainEl.appendChild(accountImageEl);
      accountMainEl.appendChild(accountInfoEl);
      accountEl.appendChild(accountMainEl);
      const deleteAccountEl = document.createElement("div");
      deleteAccountEl.classList.add("deleteVersion");
      deleteAccountEl.setAttribute("id", "trash-" + account.acronym);
      accountEl.appendChild(deleteAccountEl);
      listEl.appendChild(accountEl);
      !account.isSelected && addEvent("id", account.acronym, ipcRenderer.send, false, "selectProfile", account.appearance.name);
      addEvent("id", "trash-"+account.acronym, ipcRenderer.send, false, "deleteProfile", account.appearance.name);
      account.isSelected && tbs.push(account);
    });
    if (selected)
      tbs = [];
    setSelectedVersion(tbs[0]);
  } catch {
    return;
  }
}

let alreadyCycling = false;
let wizard = {
  appearance: {
    name: "asd",
    icon: "fxghfgh",
  }
}

function clearObject(object) {
  let temp = {};
  for (let key in object) {
     if (object.hasOwnProperty(key)) {
        if (typeof object[key] === "object") {
           temp[key] = clearObject(object[key]);
        } else {
           temp[key] = null;
        }
     }
  }
  return temp;
};

function wizardCycle() {
  if (alreadyCycling) return;
  const wizardEl = document.getElementById("wizard");
  let page = Math.round((wizardEl.scrollLeft - 17 * Math.floor(wizardEl.scrollLeft / wizardEl.offsetWidth)) / wizardEl.offsetWidth) + 1;
  let wizardAction = document.getElementById("wizardAction");
  if (page == 1) {
    wizard.appearance.name = document.getElementById("profileName").value || "Unnamed Profile " + Math.floor(Math.random() * 999) + 1;
    wizardAction.innerHTML = "Add profile";
  } else if (page == 2) {
    if (document.querySelector(".selectedVersionSE")) {
      ipcRenderer.send("addProfile", wizard);
      console.log(wizard)
      closeVersionSelect();
    } else {
      wizardAction.innerHTML = "Select a version";
      setTimeout(function () {
        wizardAction.innerHTML = "Add profile";
      }, 1000);
      return;
    }
  }
  wizardEl.scrollBy(wizardEl.offsetWidth + 17, 0);
  alreadyCycling = true;
  console.log(wizard)
  setTimeout(() => {
    alreadyCycling = false;
  }, 400);
}

ipcRenderer.on("profiles", (event, arg) => {
  createProfileList(arg);
});

function selectIcon(id) {
  wizard.appearance.icon = id;
  const icon = document.getElementById(id);
  const blocks = document.querySelectorAll(".selectedBlock");
  for (let i = 0; i < blocks.length; i++) {
    blocks[i].classList.remove("selectedBlock");
  }
  icon.classList.add("selectedBlock");
}

function launch() {
  console.log(launchOptions);
  ipcRenderer.send("launch", launchOptions);
  document.body.classList.add("loaded");
}

ipcRenderer.on("launched", () => {
});

ipcRenderer.on("progress", (event, arg) => {
  console.log("PROGRESS");
  console.log(event, arg);
})

contextBridge.exposeInMainWorld("check", check);
contextBridge.exposeInMainWorld("toggleSubTab", toggleSubTab);
contextBridge.exposeInMainWorld("wizardCycle", wizardCycle);
contextBridge.exposeInMainWorld("selectIcon", selectIcon);
contextBridge.exposeInMainWorld("toggleTab", toggleTab);
contextBridge.exposeInMainWorld("closeVersionSelect", closeVersionSelect);
contextBridge.exposeInMainWorld("selectVersion", selectVersion);
contextBridge.exposeInMainWorld("launch", launch);