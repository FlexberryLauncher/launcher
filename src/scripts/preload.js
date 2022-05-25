const { ipcRenderer, contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");
const DiscordRPC = require("discord-rpc");

DiscordRPC.register("935845425599094824");

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

let mainDir = (__dirname).split("\\scripts")[0];

function setActivity() {
  rpc.setActivity({
    details: 'In main window',
    startTimestamp,
    largeImageKey: 'flexberry_logo',
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
}

function toggleLoading(tab, forceClose) {
  let tabEl = document.getElementById(tab);
  if (forceClose)
    return tabEl.classList.remove("tabLoading");
  tabEl.classList.toggle("tabLoading");
}

window.addEventListener("DOMContentLoaded", () => {
  setActivity();
  addEvent("id", "login", ipcRenderer.send, true, "addAccount");
  ipcRenderer.send("getAccounts");
  console.log(path.join(mainDir, "style", "themes"));
  fs.readdir(path.join(mainDir, "style", "themes"), (err, files) => {
    if (err) return console.error(err);
    const themes = files.filter(file => file.endsWith(".css"));
    console.log(themes);
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("type", "text/css");
    style.setAttribute("href", `style/themes/${theme}`);
    document.head.appendChild(style);
  })
});

rpc.login({ "clientId": "935845425599094824" }).catch(console.error);

let selectedAccount = {};
let toggledTabs = [];

ipcRenderer.on("loginResult", (event, arg) => {
  if (JSON.parse(arg).status == "error") {
    // TO-DO - add error handling (maybe a pop-up?)
    toggleLoading("accounts", true);
  } else {
    const accounts = JSON.parse(JSON.parse(arg).accounts); // yes, i hate processing JSON datas...
    createList(accounts, arg.haveSelected);
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
  ipcRenderer.send("setSelected", arg.uuid);
});

ipcRenderer.on("refreshAccountResult", (event, arg) => {
  toggleLoading("accounts");
  arg = JSON.parse(arg);
  if (arg.error || !arg.accounts) {
    // TO-DO - add error handling (maybe a pop-up?)
    return console.error(arg);
  }
  ipcRenderer.send("setSelected", arg.uuid);
})

function createList(accounts, selected) {
  let tbs = [];
  console.log("[DEBUG] Creating account list");
  const listEl = document.querySelector("#accountList");
  listEl.innerHTML = "";
  const loginEl = document.createElement("div");
  loginEl.classList.add("addAccount");
  loginEl.classList.add("account");
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
    console.log(account.profile.name);
    const accountEl = document.createElement("div");
    accountEl.classList.add("account");
    account.isSelected && accountEl.classList.add("selectedAccount");
    account.isSelected && (selectedAccount = account);
    accountEl.setAttribute("id", account.uuid);
    const accountMainEl = document.createElement("div");
    accountMainEl.classList.add("accountMain");
    const accountImageEl = document.createElement("img");
    accountImageEl.classList.add("accountImage");
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
}

function setSelectedAccount(account) {
  toggleLoading("accounts", true);
  selectedAccount = {};
  if (account)
    selectedAccount = account;
  let toBePlaced = account ? account.profile.name : "Not logged in";
  document.getElementById("username").innerHTML = toBePlaced;
}

function toggleTab(tabName) {
  if (!tabName) 
    tabName = toggledTabs[0];
  if (!toggledTabs[0]) {
    document.getElementById(tabName).classList.add("visibleTab");
    document.getElementById(tabName + "Toggler").classList.add("toggledButton");
    toggledTabs.push(tabName);
  } else if (toggledTabs[0] == tabName) {
    document.getElementById(tabName).classList.remove("visibleTab");
    document.getElementById(tabName + "Toggler").classList.remove("toggledButton");
    toggledTabs.shift();
  } else {
    document.getElementById(toggledTabs[0]).classList.remove("visibleTab");
    document.getElementById(toggledTabs[0] + "Toggler").classList.remove("toggledButton");
    document.getElementById(tabName).classList.add("visibleTab");
    document.getElementById(tabName + "Toggler").classList.add("toggledButton");
    toggledTabs[0] = tabName;
  }
  rpc.setActivity({
    details: 'In ' + (toggledTabs[0] ? (tabName + ' tab') : 'the main menu'),
    startTimestamp,
    largeImageKey: 'flexberry_logo',
    largeImageText: 'Flexberry Launcher',
    instance: false,
  });
}

contextBridge.exposeInMainWorld("toggleTab", toggleTab);