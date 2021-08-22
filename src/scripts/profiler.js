const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync("profiles.json")

module.exports = {
    addVersion: function (version = "1.17.1", allocatedMemory = "2G", width = 820, height = 480, name = version) {
        const versions = low(adapter);
        const profile = {
            version: version,
            allocatedMemory: allocatedMemory,
            width: width,
            height: height
        };
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