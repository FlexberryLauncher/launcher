const axios = require("axios");

module.exports = (javaVersionCode) => {
  const os = process.platform == "win32" ? "windows" : process.platform == "darwin" ? "mac-os" : "linux";
  const arch = os == "linux" ? "" : ((os == "mac-os" ? (process.arch == "arm64" ? "arm64" : "") : (process.arch == "x64" ? "x64" : "x86")));
  const pc = os + "-" + arch;
  return new Promise (async (resolve, reject) => {
    axios.get("https://flexberry.app/api/java").then(res => {
      if (!Object.keys(res.data).includes(pc))
        return reject("Unsupported platform");
      if (!res.data[pc][javaVersionCode])
        return reject("Unsupported java version");
      resolve(res.data[pc][javaVersionCode][0]);
    }).catch(() => {
      reject("Unknown error");
    });
  });
}