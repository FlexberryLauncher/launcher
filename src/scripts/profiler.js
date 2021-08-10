const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync("profiles.json"/*require("path").join(process.env.APPDATA, '.minecraft', 'profiles.json')*/)

module.exports = {
    addVersion: function (version = "1.17.1", allocatedMemory = "2G", width = "820", height = "480") {
        const versions = low(adapter);
        console.log(version, allocatedMemory, width, height)
    }
}