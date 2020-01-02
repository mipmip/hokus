//@flow

const electron = require('electron')
const ipcMainBinder = require('./ipc-main-binder');
const mainWindowManager = require('./main-window-manager');
const logWindowManager = require('./log-window-manager');
const unhandled = require('electron-unhandled');
const contextMenu = require('electron-context-menu');
const BrowserWindow = electron.BrowserWindow;

unhandled();

// Module to control application life.
const app = electron.app
const Menu = electron.Menu

//global.sharedObj = {prop1: null};
global.hugoServer = undefined;
global.currentServerProccess = undefined;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let logWindow;

function createMainWindow () {

  // Create the browser window.
  mainWindow = mainWindowManager.getCurrentInstanceOrNew();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  contextMenu(mainWindow);
}

function openHome() {
  mainWindow = mainWindowManager.getCurrentInstanceOrNew();
  if (mainWindow) {
    mainWindow.webContents.send("redirectHome")
  }
}

function openCookbooks() {
  mainWindow = mainWindowManager.getCurrentInstanceOrNew();
  if (mainWindow) {
    mainWindow.webContents.send("redirectCookbook")
  }
}

function stopServer() {
  if(global.hugoServer){
    global.hugoServer.stopIfRunning(function(err, stdout, stderr){
      if(err) reject(err);
      else{ resolve(); }
    });
  }
}

function createLogWindow () {
  logWindow = logWindowManager.getCurrentInstanceOrNew();
  if (logWindow) {
    logWindow.webContents.send("redirectConsole")
  }

  logWindow.once('ready-to-show', () => {
    logWindow.webContents.send("redirectConsole")
  })

  logWindow.webContents.on('did-finish-load',() => {
    logWindow.webContents.send("redirectConsole")
  })

  logWindow.on('closed', function() {
    logWindow = null
  })
}

function createMainMenu(){

  const isMac = process.platform === 'darwin'

  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        {
          label: 'Front page',
          click: async () => {
            openHome()
          }
        },
        {
          label: 'Open Form Cookbooks',
          click: async () => {
            openCookbooks()
          }
        },
        {
          label: 'Show Log Window',
          click: async () => {
            createLogWindow()
          }
        },
        {
          label: 'Stop server',
          click: async () => {
            stopServer()
          }
        },
        { type: 'separator' },

        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },

        { type: 'separator' },

        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
  createMainMenu();
  createMainWindow();
})

app.on('before-quit', function () {
  stopServer();
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow()
  }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMainBinder.bind();
