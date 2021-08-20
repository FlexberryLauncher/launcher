const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync("profiles.json")

class Profile {
    constructor(version, allocatedMemory, width, height) {
        this.version = version;
        this.allocatedMemory = allocatedMemory;
        this.width = width;
        this.height = height;
    }
}

module.exports = {
    addVersion: function (version = "1.17.1", allocatedMemory = "2G", width = 820, height = 480, name = version) {
        const versions = low(adapter);
        const profile = new Profile(version, allocatedMemory, width, height);
        versions.defaults({ versions: [] })
            .write();
        console.log(
            versions.get("versions")
            .push(profile)
            .write()
        )
        console.log(name)
    }
}