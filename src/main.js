const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fse = require('fs-extra');

require('electron-reload')(__dirname);


const data_dir = path.join(
    __dirname,
    "data"
);
const config_file = path.join(
    data_dir,
    "config.json"
);
process.env['MAILGUN_DATA_DIR'] = data_dir;


var domain = null;
var apiKey = null;


global.sharedObj = {
    "DATA_DIR": data_dir,
    "CONFIG_FILE_PATH": config_file,
    "CONFIG": {
        "MAILGUN_USR_DOMAIN": process.env.MAILGUN_USR_DOMAIN || domain,
        "MAILFUN_USR_APIKEY": process.env.MAILFUN_USR_APIKEY || apiKey
    }
};

async function getConfig() {
    if (fse.pathExistsSync(global.sharedObj.CONFIG_FILE_PATH)) {
        global.sharedObj.CONFIG = await fse.readJson(
          global.sharedObj.CONFIG_FILE_PATH);
    }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  getConfig();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    center: true,
    closable: true,
    alwaysOnTop: false,
    // fullscreen: true,
    kiosk: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Build memnu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
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

ipcMain.on('online-status-changed', (event, status) => {
  console.log(status)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        click() {
          app.quit();
        }
      }
    ]
  }
]
