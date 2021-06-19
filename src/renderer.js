const { ipcRenderer } = require('electron')

var options = {
    release: true,   // releases like 1.17, 1.8 etc.
    snapshot: false, // snapshots like 21w16a etc.
    old_alpha: false // releases like release-candite, infdev etc.
}

function get(url, fn) {
    return new Promise((resolve, reject) => {
        const http = require('http'),
              https = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err) => {
            reject(err);
        });
    });
};

// TO-DO
// add button to refresh versions
var versions = [];
function getVersions() {
    get('https://launchermeta.mojang.com/mc/game/version_manifest.json')
    .then(data => {
        versions = JSON.parse(data).versions
        updateVersions();
    });
}

getVersions();

var filteredVersions = [];
// filtering versions by user preference and sorting them by release date automatically with these lines.
function updateVersions(option, state) {
    if (option)
        options[option] = state ? state : !options[option];
    // preventing duplication :)
    filteredVersions = [];
    versions.forEach(ver => {
        options[ver.type] && filteredVersions.push(ver)
    });
    // adding filtered versions to a selectbox
    var select = document.getElementById("version");
    select.innerHTML = "";
    select.innerHTML += filteredVersions.map(ver => {
        return `<option value="${ver.url}" data-type="${ver.type}">${ver.id}</option>`
    })
}

/* for byte inputs:
 * 1 = byte to kilobyte
 * 2 = byte to megabyte
 * 3 = byte to gigabyte
 */

/* for kb inputs:
 * divide byte inputs by 2. example:
 * 1 = kilobyte to megabyte
 * 2 = kilobyte to gigabyte
 */
Number.prototype.toUnit = function (int) {
    var bytes = this;
    var sizes = [' bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    for (var i = 0; i < sizes.length; i++) {
        if (bytes <= 1024) {
            return bytes + sizes[i];
        } else {
            bytes = parseFloat(bytes / 1024).toFixed()
        }
    }
    return bytes + 'PB';
}

var selectedVersion = {};
function install() {
    var url = document.getElementById('version').value
    url && get(url)
    .then(data => {
        selectedVersion = JSON.parse(data)
        document.getElementById("data").innerHTML =
        `
        <b>client download</b> ${selectedVersion.downloads.client.url} | ${selectedVersion.downloads.client.size.toUnit()}<br>
        <b>server download</b> ${selectedVersion.downloads.server ? selectedVersion.downloads.server.url : "unknown"} | ${selectedVersion.downloads.server ? selectedVersion.downloads.server.size.toUnit() : 0}<br>
        <b>required java version</b> ${selectedVersion.javaVersion ? selectedVersion.javaVersion.majorVersion : "unknown"}<br>
        <b>release time</b> ${new Date(selectedVersion.releaseTime)}<br>
        `
    })
}

// custom close button thingie
document.getElementById("close").addEventListener("click", function() {
    ipcRenderer.send('close')
});

document.getElementById("title").addEventListener("click", function() {
    ipcRenderer.send("switchTheme")
})
