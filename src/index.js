const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const msmc = require("msmc");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 830,
    height: 566,
    titleBarStyle: 'hidden',
    fullscreenable: false,
    resizable: false,
    icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "scripts", "preload.js"),
    },
  });

  /* const loginWindow = new BrowserWindow({
    width: 420,
    height: 620,
    titleBarStyle: 'hidden',
    fullscreenable: false,
    resizable: false,
    icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "scripts", "preload.js"),
    },
  });

  loginWindow.loadFile(path.join(__dirname, "login.html")); */
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  ipcMain.on("minimize", () => mainWindow.minimize());

  ipcMain.on("login", (event) => {
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
  })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
