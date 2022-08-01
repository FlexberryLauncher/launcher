const axios = require("axios");
const unzipper = require("unzipper");
const { join, resolve } = require("path");
const { createWriteStream, createReadStream, existsSync, unlinkSync } = require("fs");
const parentDir = resolve(__dirname, "..");
const updateZip = join(parentDir, "updateModules.zip")

module.exports.checkUpdates = () => {
  return console.error("UPDATER IS DISABLED");
  axios.get("https://api.github.com/repos/FlexberryLauncher/updater-test/releases/latest").then(async (res) => {
    if (process.env.npm_package_version !== res.data.tag_name && !existsSync(__dirname + "/updateModules.zip")) {
      axios({
        url: res.data.assets[0].browser_download_url,
        method: "get",
        responseType: "stream"
      }).then((response) => {
        const stream = createWriteStream(updateZip)
        response.data.pipe(stream);
        stream.on("finish", () => {
          createReadStream(updateZip).pipe(unzipper.Extract({ path: parentDir }).on("close", () => {
            unlinkSync(updateZip);
          }));
        });
      });
    }
  }).catch(err => {
    console.log("Couldn't check updates due connection problems")
  });
}