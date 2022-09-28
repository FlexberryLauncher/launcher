const { createWriteStream } = require('fs');
const { app } = require('electron');
const { join } = require('path');

require('colors');

const date = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
}).replace(/[/]/g, "-").replace(/[,]/g, "").replace(/[:]/g, "-");

const icons = {
  "info": " i ".bgBlue,
  "error": " x ".bgRed,
}

module.exports = () => {
  try {
    const logFile = join(app.getPath("logs"), `${date}.log`);
    const logStream = createWriteStream(logFile, { flags: "a" });
    return {
      log: (message) => {
        try {
          if (message == "$1")
            return logStream.write("\n\n")
          let log = `[ i ] [ ${(new Date()).toLocaleTimeString()} ] ${message}\n`;
          console.log(`${icons.info} ${message}`);
          app.isPackaged && logStream.write(log);
        } catch (e) {
          console.error(e);
        }
      },
      error: (message) => {
        try {
          let log = `[ x ] [ ${(new Date()).toLocaleTimeString()} ] ${(message instanceof Error) ? message.stack : message}\n`;
          console.error(`${icons.error} ${message}`);
          app.isPackaged && logStream.write(log);
        } catch (e) {
          console.error(e);
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}