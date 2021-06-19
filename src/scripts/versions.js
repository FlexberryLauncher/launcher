const { get } = require("./utils");
module.exports = {
    /**
     * @description Get list of all Minecraft versions with date order.
     * @returns Array of Minecraft versions.
     */
    getVersions: new Promise ((resolve) => {
        get('https://launchermeta.mojang.com/mc/game/version_manifest.json').then(
            data => {
                resolve(JSON.parse(data))
            }
        )
    }),
    /**
     * @description Filters inputted versions by using inputted options
     * @param {Array} versions
     * @param {Object} options
     * @returns Array of filtered versions.
     */
    filterVersions: function (versions, options) {
        if (!versions || !options) 
            return new Error("Inputted insufficient amout of arguments");
        var filteredVersions = new Array();
        versions.forEach(ver => {
            options[ver.type] && filteredVersions.push(ver)
        });
        return filteredVersions;
    }
}