const { ipcMain } = require('electron');
const msmc = require("msmc");
const lowdb = require("lowdb");

module.exports = {
  addAccount: function(account, event) {
    msmc.fastLaunch("electron",
      (update) => {
        //A hook for catching loading bar events and errors, standard with MSMC
        
      }).then(result => {
        //If the login works
        if (msmc.errorCheck(result)) {
          event.reply("loginResult", JSON.stringify(result));
          return { status: "error", error: result.reason};
        }
        event.reply("loginResult", JSON.stringify(result));
        console.log(result)
        return { status: "success", data: result};
      }).catch(reason => {
        event.reply("loginResult", JSON.stringify(reason));
        return { status: "error", error: reason};
      })
  }
}