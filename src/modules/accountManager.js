const { app, ipcMain } = require("electron");
const msmc = require("msmc");
const path = require("path");

const low = require("lowdb");
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(path.join(app.getPath("userData"), "accounts.json"));
const db = low(adapter)

const berry = require("./logger")();

module.exports = (win) => {
  async function setup() {
    await db.defaults({ accounts: [] }).write()
    let selectedAccount = await db.get('accounts').find({ isSelected: true }).value();
    if (selectedAccount && !msmc.validate(selectedAccount.profile)) {
      berry.log("Attempting to refresh account " + selectedAccount.profile.name, "accountManager")
      msmc.refresh(selectedAccount.profile).then(async result => {
        let profile = result.profile;
        db.get("accounts").find({ uuid: selectedAccount.uuid }).assign({ profile }).write();
        berry.log("Refreshed account " + selectedAccount.profile.name, "accountManager");
      }).catch(reason => {
        db.get('accounts').find({ isSelected: true }).assign({ isSelected: false }).write();
        berry.error("Error refreshing account Stack:\n" + reason?.stack, "accountManager");
      })
    }
  }

  setup();

  ipcMain.on("addAccount", (event) => {
    msmc.fastLaunch("electron",
      (update) => {
        if (update.percent == 0)
          berry.log("Logging in to Microsoft account", "accountManager");
      }, undefined, {
        resizable: false,
        fullscreenable: false,
        width: 520,
        height: 700,
        icon: path.join(__dirname, "../assets/images/flexberry-launcher-icon.png"),
      }).then(async result => {
        if (msmc.errorCheck(result)) {
          berry.error("Error logging in: " + result.reason, "accountManager");
          event.reply("accounts", JSON.stringify({ status: "error", error: result.reason}));
          return;
        }
        
        if ((await db.get("accounts").find({ uuid: result.profile.id }).value())) {
          berry.error("Account already exists", "accountManager");
          event.reply("accounts", JSON.stringify({ status: "error", error: "Account already exists"}));
        } else {
          let xbox = await result.getXbox();
          newData = {
            uuid: result.profile.id,
            access_token: result.access_token,
            profile: result.profile,
            xbox: xbox,
            isSelected: true
          }
          await db.get('accounts').find({ isSelected: true }).assign({ isSelected: false }).write();
          let accs = await db.get("accounts").push(newData).write();
          berry.log("Logged in to account " + result.profile.name, "accountManager");
          event.reply("accounts", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
        }
      }).catch(reason => {
        berry.error("Error logging in Stack:\n" + reason?.stack, "accountManager");
        event.reply("accounts", JSON.stringify({ status: "error", error: reason}));
      })
  });

  ipcMain.on("verifyAccount", async (event, uuid) => {
    berry.log("Verifying account " + uuid, "accountManager");
    let profileObject = db.get("accounts").find({ uuid: uuid }).value();
    if (!profileObject)
      return event.returnValue = JSON.stringify({ status: "error", error: "Account not found"});
    let isValid = msmc.validate(profileObject.profile);
    event.returnValue = JSON.stringify({ status: "success", valid: isValid, uuid});
  });

  ipcMain.on("selectAccount", async (event, uuid) => {
    await db.get("accounts").find({ isSelected: true}).assign({ isSelected: false }).write();
    await db.get("accounts").find({ uuid: uuid }).assign({ isSelected: true }).write();
    let accs = await db.get("accounts").value();
    event.reply("accounts", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
    berry.log("Selected account " + uuid, "accountManager");
  });

  ipcMain.on("refreshAccount", async (event, uuid) => {
    berry.log("Refreshing account " + uuid, "accountManager");
    let profileObject = db.get("accounts").find({ uuid: uuid }).value();
    if (!profileObject)
      return event.reply("refreshAccountResult", JSON.stringify({ status: "error", error: "Account not found"}));
    msmc.refresh(profileObject.profile).then(async result => {
      let profile = result.profile;
      await db.get("accounts").find({ uuid: uuid }).assign({ profile }).write();
      let accounts = await db.get("accounts").value();
      return event.reply("refreshAccountResult", JSON.stringify({ status: "success", valid: false, uuid, accounts }));
    }).catch(reason => {
      berry.error("Error refreshing account Stack:\n" + reason?.stack, "accountManager");
      return event.reply("refreshAccountResult", JSON.stringify({ status: "error", error: reason}));
    });
  })

  ipcMain.handle("getAccounts", async (event) => {
    const accounts = await db.get("accounts").value();
    return JSON.parse(JSON.stringify(accounts));
  });

  ipcMain.on("deleteAccount", async (event, data) => {
    let accs = await db.get("accounts").value();
    if ((await db.get("accounts").find({ uuid: data }).value())) {
      await db.get("accounts").remove({ uuid: data }).write();
      if (accs[0])
        await db.get("accounts").first().assign({ isSelected: true }).write();
      else {
        berry.error("Can't delete account because no accounts left", "accountManager");
        return event.reply("accounts", JSON.stringify({ status: "success", accounts: JSON.stringify(accs), haveSelected: false }));
      }
    }
    event.reply("accounts", JSON.stringify({ status: "success", accounts: JSON.stringify(accs), haveSelected: true }));
  });

  function pong() {
    win.webContents.send("pong", { from: "accountManager", call: ["getAccounts"] });
  };

  ipcMain.on("ping", pong);
  pong();
}