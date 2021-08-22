const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')
require("ejs-electron");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 720,
    height: 420,
    icon: __dirname + '/src/assets/logo.ico',
    frame: false,
    resizable: false,
    fullscreenable: false,
    webPreferences: {
      spellcheck: false,
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'src/preload.js')
    },
  })
  mainWindow.loadFile('src/index.ejs')
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

ipcMain.on('close', (event) => {
  BrowserWindow.getFocusedWindow().close();
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})
