const { Authenticator } = require("minecraft-launcher-core");
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync("accounts.json")

module.exports = {
    /**
     * @description Logins to specifiend Minecraft account and adds it to profiles if "rememberMe" is specified.
     * @param {String} Username or email 
     * @param {String} Password
     * @param {Boolean} Remember me
     * @returns {Object} Current profiles
     */
    addProfile: function (username, password) {
        const profiles = low(adapter);

        profiles.defaults({ profiles: [] })
            .write();

        return new Promise(function (resolve, reject) {
            if (!username) return reject("Please provide an username or email");
            Authenticator.getAuth(username, password)
                .then(async profile => {
                    if (await profiles.get("profiles").map("name").write().includes(profile.name)) return reject("Already logged in using this details.")
                    resolve(
                        profiles.get("profiles")
                            .push(profile)
                            .write()
                    )
                })
                .catch(err => {
                    if (err.toString().includes("Forbidden"))
                        reject("Wrong login details were provided.");
                });
        });
    },
    removeProfile: async function (username) {
        const profiles = low(adapter);

        profiles.defaults({ profiles: [] })
            .write();

        if (await profiles.get("profiles").map("name").write().includes(username))
            return profiles.get("profiles")
                .remove({ name: username })
                .write();
        else return console.error("Couldn't find a profile with this username to delete.");
    },
    reset: function () {
        const profiles = low(adapter);

        return profiles.set("profiles", []).write();
    }
}