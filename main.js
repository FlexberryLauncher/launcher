const {app, ipcMain, nativeTheme} = require('electron')
const {BrowserWindow} = require("electron-acrylic-window");
const path = require('path')

// TO-DO
// Add dynamic window scale depends on user's screen size.
function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 500,
    frame: false,
    resizable: false,
    fullscreenable: false,
    vibrancy: {
      useCustomWindowRefreshMethod: true,
      maximumRefreshRate: 30,
      disableOnBlur: false,
      theme: "dark"
    },
    webPreferences: {
      spellcheck: false,
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'src/preload.js')
    },
  })
  mainWindow.loadFile('src/index.html')
  var theme = "dark";
  nativeTheme.themeSource = theme;
  ipcMain.on('switchTheme', (event) => {
    theme = (theme == "dark" ? "light" : "dark")
    nativeTheme.themeSource = theme;
    mainWindow.setVibrancy({
      useCustomWindowRefreshMethod: true,
      maximumRefreshRate: 30,
      disableOnBlur: false,
      theme: theme
    })
  })  
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.on('close', (event) => {
  BrowserWindow.getFocusedWindow().close()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
