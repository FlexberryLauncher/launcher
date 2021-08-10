const { ipcRenderer } = require('electron')
const { getVersions, filterVersions } = require("./scripts/versions.js")
const launchMinecraft = require("./scripts/launcher.js");
var filteredVersions = new Array();
var versions;
getVersions().then(data => {
    versions = data;
    updateVersions("release", true);
});
require("./scripts/ipc")

var options = {
    versions: {
        release: false,    // releases like 1.17, 1.8 etc.
        snapshot: false,  // snapshots like 21w16a etc.
        old_alpha: false  // releases like release-candite, infdev etc.
    },
    lang: process.env.lang // TO-DO // Add language support
}

setTimeout(console.clear, 500)

/**
 * @param {String} option 
 * @param {Boolean} boolean 
 */
function updateVersions(option, boolean) {
    if (!Object.keys(options.versions).includes(option))
        return new Error("Invalid option inputted");
    if (typeof boolean != "boolean")
        return new Error("Parameter 'boolean' must be Boolean");
    options.versions[option] = boolean;
    filteredVersions = filterVersions(versions, options.versions);
    // document.getElementById("version").innerHTML = filteredVersions.length > 0 ? filteredVersions.map(ver => {
        // return `<option value="${ver}" data-type="${ver.type}">${ver.id}</option>`
    // }) : `<option value="false" data-type="info">Select version type checkbox</option>`
}

function launch() {
    const selectedVersion = document.getElementById("version").value;
    console.log(launchMinecraft(selectedVersion, "2G"))
}