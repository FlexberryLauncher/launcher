const { ipcMain } = require('electron');
const msmc = require("msmc");
const path = require('path');
const fs = require("fs");

const low = require("lowdb");
const FileSync = require('lowdb/adapters/FileSync');

let pth = null;

if (process.platform == "win32") {
  pth = (path.join(process.env.APPDATA, "flexberry-launcher", "accounts.json"));
} else if (process.platform == "darwin") {
  pth = (path.join(process.env.HOME, "Library", "Application Support", "Flexberry Launcher", "accounts.json"));
} else if (process.platform == "linux") {
  pth = (path.join(process.env.HOME, ".flexberry-launcher", "accounts.json"));
}

!fs.existsSync(pth) && fs.openSync(pth, "w") && console.log("Not found " + pth + "\nCreating it!");

const adapter = new FileSync(pth);
const db = low(adapter)

// TO-DO - C L E A N     T H I S     C O D E

async function setup() {
  await db.defaults({ accounts: [] }).write()
  let selectedAccount = await db.get('accounts').find({ isSelected: true }).value();
  if (selectedAccount && !msmc.validate(selectedAccount.profile)) {
    console.log("[MANAGERS => ACCOUNT MANAGER] Deselecting selected account, because it's expired.");
    db.get('accounts').find({ isSelected: true }).assign({ isSelected: false }).write();
  }
}

setup();

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
      alwaysOnTop: true,
      icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    }).then(async result => {
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
          xbox: xbox,
          isSelected: false
        }
        let accs = await db.get("accounts").push(newData).write();
        event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
      }
    }).catch(reason => {
      console.log("Error logging in:", reason);
      event.reply("loginResult", JSON.stringify({ status: "error", error: reason}));
    })
});


ipcMain.on("verifyAccount", async (event, uuid) => {
  console.log("[IPC] verifyAccount");
  let profileObject = db.get("accounts").find({ uuid: uuid }).value();
  if (!profileObject)
    return event.reply("verifyAccountResult", JSON.stringify({ status: "error", error: "Account not found"}));
  let isValid = msmc.validate(profileObject.profile);
  event.reply("verifyAccountResult", JSON.stringify({ status: "success", valid: isValid, uuid}));
  console.log("[IPC] |-> " + isValid);
});

ipcMain.on("setSelectedAccount", async (event, uuid) => {
  console.log("[IPC] setSelected");
  await db.get("accounts").find({ isSelected: true}).assign({ isSelected: false }).write();
  await db.get("accounts").find({ uuid: uuid }).assign({ isSelected: true }).write();
  let accs = await db.get("accounts").value();
  event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
});

ipcMain.on("refreshAccount", async (event, uuid) => {
  console.log("[IPC] refreshAccount");
  let profileObject = db.get("accounts").find({ uuid: uuid }).value();
  if (!profileObject)
    return event.reply("refreshAccountResult", JSON.stringify({ status: "error", error: "Account not found"}));
  msmc.refresh(profileObject.profile).then(async result => {
    let profile = result.profile;
    await db.get("accounts").find({ uuid: uuid }).assign({ profile }).write();
    let accounts = await db.get("accounts").value();
    return event.reply("refreshAccountResult", JSON.stringify({ status: "success", valid: false, uuid, accounts }));
  }).catch(reason => {
    return event.reply("refreshAccountResult", JSON.stringify({ status: "error", error: reason}));
  });
})

ipcMain.on("getAccounts", async (event) => {
  let accs = await db.get("accounts").value();
  event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs) }));
});

ipcMain.on("deleteAccount", async (event, data) => {
  let accs = await db.get("accounts").value();
  if ((await db.get("accounts").find({ uuid: data }).value()).isSelected) {
    await db.get("accounts").remove({ uuid: data }).write();
    if (accs[0])
      await db.get("accounts").first().assign({ isSelected: true }).write();
    else {
      console.log("DELETE [ELSE] >> No accounts left");
      return event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs), haveSelected: false }));
    }
  }
  event.reply("loginResult", JSON.stringify({ status: "success", accounts: JSON.stringify(accs), haveSelected: true }));
});