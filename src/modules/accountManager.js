const { ipcMain } = require('electron');
const msmc = require("msmc");
const path = require('path');

const low = require("lowdb");
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('accounts.json')
const db = low(adapter)

db.defaults({ accounts: [] })
  .write()

ipcMain.on("addAccount", (event) => {
  msmc.fastLaunch("electron",
    (update) => {
      console.log((update.percent || 0) + "% - Logging in...");
    }, undefined, {
      resizable: false,
      fullscreenable: false,
      width: 520,
      height: 700,
      titleBarStyle: 'hidden',
      skipTaskbar: true,
      icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    }).then(async result => {
      //If the login works
      if (msmc.errorCheck(result)) {
        console.log("Error logging in:", result.reason);
        event.reply("loginResult", JSON.stringify({ status: "error", error: result.reason}));
        return;
      }
      
      if ((await db.get("accounts").find({ uuid: result.profile.id }).value())) {
        console.log("Account already exists");
        event.reply("loginResult", JSON.stringify({ status: "error", error: "Account already exists"}));
      } else {
        let xbox = await result.getXbox();
        newData = {
          uuid: result.profile.id,
          access_token: result.access_token,
          profile: result.profile,
          xbox: xbox
        }

        let accs = await db.get("accounts").push(newData).write();
        event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs)}));
      }
    }).catch(reason => {
      console.log("Error logging in:", reason);
      event.reply("loginResult", JSON.stringify({ status: "error", error: reason}));
    })
});

ipcMain.on("getAccounts", async (event) => {
  let accs = await db.get("accounts").value();
  event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs)}));
});

ipcMain.on("deleteAccount", async (event, data) => {
  await db.get("accounts").remove({ uuid: data }).write();
  let accs = await db.get("accounts").value();
  console.log(accs);
  event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs)}));
});