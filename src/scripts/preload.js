const { ipcRenderer } = require("electron");
const msmc = require("msmc");
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
function addEvent(element, event, ...params) {
  console.log(params)
  document.querySelector(element).addEventListener("click", () => {
    event(...params);
  });
} 

window.addEventListener("DOMContentLoaded", () => {
  //addEvent("#minimize", ipcRenderer.send, "minimize");
  addEvent("#login", ipcRenderer.send, "login");
  addEvent("#login", setLoading, "#username", "text");
});

ipcRenderer.on("loginResult", (event, arg) => {
  let data = JSON.parse(arg);
  console.log(data);
  document.getElementById("username").innerHTML = data.profile.name == "Player" ? "Demo User" : data.profile.name;
});

function setLoading(element, type) {
  if (type == "text")
    return document.querySelector(element).innerHTML = "Loading...";
}