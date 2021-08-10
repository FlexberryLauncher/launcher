const Authenticator = require("./authenticator.js");
const { Client } = require("minecraft-launcher-core");

module.exports = function (username, password, version, memory) {
    Authenticator.addProfile(username, password)
        .then(console.log)
        .catch(console.error);
    return;
}