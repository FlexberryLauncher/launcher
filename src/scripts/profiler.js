const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync("profiles.json")

module.exports = {
    addVersion: function (version = "1.17.1", allocatedMemory = "2G", width = 820, height = 480, name = "Unnamed") {
        const versions = low(adapter);
        const profile = {
            id: Date.now(),
            name: name,
            version: version,
            allocatedMemory: allocatedMemory,
            width: width,
            height: height,
            selected: false
        };
        versions.defaults({ versions: [] })
            .write();
        versions.get("versions")
            .push(profile)
            .write()
        loadProfiles();
    }
}