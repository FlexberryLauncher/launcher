const { ipcRenderer } = require('electron')
const { getVersions, filterVersions } = require("./scripts/versions.js")
const versions = getVersions;
var filteredVersions = new Array();

var options = {
    release: true,   // releases like 1.17, 1.8 etc.
    snapshot: false, // snapshots like 21w16a etc.
    old_alpha: false // releases like release-candite, infdev etc.
}

/**
 * @param {String} option 
 * @param {Boolean} boolean 
 */
function updateVersions(option, boolean) {
    if (!Object.keys(options).includes(option))
        return new Error("Invalid option inputted");
    if (typeof boolean != "boolean")
        return new Error("Parameter 'boolean' must be Boolean");
    filteredVersions = filterVersions(versions, options);
}

document.getElementById("version").innerHTML = filteredVersions.map(ver => {
    return `<option value="${ver}" data-type="${ver.type}">${ver.id}</option>`
})

// custom close button
document.getElementById("close").addEventListener("click", function() {
    ipcRenderer.send('close')
});

// completely useless theme switch, i guess i'll remove it
document.getElementById("title").addEventListener("click", function() {
    ipcRenderer.send("switchTheme")
})
