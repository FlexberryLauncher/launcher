const { ipcRenderer } = require("electron");
const fs = require("fs");

function addEvent(element, event, ...params) {
  document.querySelector(element).addEventListener("click", () => {
    event(...params);
  });
} 

window.addEventListener("DOMContentLoaded", () => {
  addEvent("#login", ipcRenderer.send, "addAccount");
  ipcRenderer.send("getAccounts");

  fs.readdir("./src/style/themes", (err, files) => {
    if (err) return console.error(err);
    const themes = files.filter(file => file.endsWith(".css"));
    console.log(themes);
    // get random theme
    const theme = themes[Math.floor(Math.random() * themes.length)];
    // create style element
    const style = document.createElement("link");
    style.setAttribute("rel", "stylesheet");
    style.setAttribute("type", "text/css");
    style.setAttribute("href", `style/themes/${theme}`);
    document.head.appendChild(style);
  })
});

ipcRenderer.on("loginResult", (event, arg) => {
  if (arg.status == "error") {
    // TO-DO - add error handling (maybe a pop-up?)
    console.error(arg);
  } else {
    const accounts = JSON.parse(JSON.parse(arg).accounts); // yes, i hate processing JSON datas...
    createList(accounts);
  }
});

function createList(accounts) {
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
  addEvent("#login", ipcRenderer.send, "addAccount");
  accounts.forEach(account => {
    console.log(account.profile.name);
    const accountEl = document.createElement("div");
    accountEl.classList.add("account");
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
    addEvent("#trash-"+account.uuid, ipcRenderer.send, "deleteAccount", account.uuid);
  });
} 

function setLoading(element, type) {
  if (type == "text")
    return document.querySelector(element).innerHTML = "Loading...";
}