
var fs = require('fs');
var app = require('electron').app;
var ipc = require('electron').ipcMain;
var BrowserWindow = require('electron').BrowserWindow;
var path = require('path');
var ioHook = require(app.getAppPath() + '/resources/iohook/index');

// get the paths of the html files
const softphoneHTML = path.join('file://', __dirname, 'softphone.html');
const configHTML = path.join('file://', __dirname, 'controlpanel.html');
var config;

// get data path
const userDataPath = path.join(app.getPath('userData'), 'config.json')

// Either retrieve existing data or use default values
var data;
try{
  data = JSON.parse(fs.readFileSync(userDataPath));
} catch {
  console.log('hi?')
}

data = data || JSON.parse(fs.readFileSync(path.join(__dirname, 'resources/defaults.json')))

console.log(data)

// const debug = require('electron-debug');

// debug();

app.on('ready', function(){
  openConfig();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    openConfig()
  }
})

function openConfig(){

  // create window
  config = new BrowserWindow({
    width: 800,
    height: 500,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true
    },
    show:false,
  });

  // load HTML
  config.loadURL(configHTML);

  config.once('ready-to-show', () => {
    config.show();
    // send data to window
    config.webContents.send('userData', data);
  })

  config.once('close', () => {
    // close the window
    config = null;
    // stop ioHook
    ioHook.stop();
    ioHook.unload();
  });
}

ipc.on('submit', (event, configData) => {

  data = configData;

  console.log('submitted');
  console.log(data);

  // save the data
  fs.writeFileSync(userDataPath, JSON.stringify(data));

  // start listening for the shortcut
  restartIoHook();

});

function openSoftphone () {

  // create window
  softphone = new BrowserWindow({
    width: 520,
    height: 320,
    transparent: true,
    resizable:true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true
    },
    show: false
  });

  // load HTML
  softphone.loadURL(softphoneHTML);

  softphone.once('ready-to-show', () => {
    softphone.show();

    // send data to the window
    softphone.webContents.send('config', data);
  });

  softphone.once('close', () => {
    // close window
    softphone = null;
    // start listening for shortcut again
    restartIoHook();
  });
};

function restartIoHook(){
  ioHook.start();
  ioHook.registerShortcut(data.keycode, function(){
    ioHook.unregisterAllShortcuts();
    ioHook.stop();
    openSoftphone(data)
  });
}

ipc.once('record', record);

function record(event){
  console.log("recording");

  data.keycode = [];

  ioHook.start();

  ioHook.on("keydown",function(msg){
    data.keycode.push(msg.keycode);
  });

  ioHook.on("keyup",function(msg){
    ioHook.stop();
    console.log(data.keycode);
    config.webContents.send('keycode', data.keycode);
    ipc.once('record', record);
    ioHook.removeAllListeners('keydown')
    ioHook.removeAllListeners('keyup')
  });

}
