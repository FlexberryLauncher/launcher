const fs = require('fs');
const colors = require('colors');
const { app } = require('electron');

const icons = {
  "info": " i ".bgBlue,
  "error": " x ".bgRed,
}

module.exports = (logPath) => {
  const logFile = logPath;
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  return {
    log: (message) => {
      try {
        if (message == "$1")
          return logStream.write("\n\n")
        let log = `[  INFO  ] [ ${(new Date()).toLocaleString("en-US")} ] ${message}\n`;
        console.log(`${icons.info} ${message}`);
        app.isPackaged && logStream.write(log);
      } catch (e) {
        console.error(e);
      }
    },
    error: (message) => {
      try {
        let log = `[ ERROR! ] [ ${(new Date()).toLocaleString("en-US")} ] ${(message instanceof Error) ? message.stack : message}\n`;
        console.error(`${icons.error} ${message}`);
        app.isPackaged && logStream.write(log);
      } catch (e) {
        console.error(e);
      }
    }
  }
}