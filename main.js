
var fs = require('fs');
var app = require('electron').app;
var ipc = require('electron').ipcMain;
var BrowserWindow = require('electron').BrowserWindow;
var path = require('path');
var ioHook = require(app.getAppPath() + '/resources/iohook/index');

// get the paths of the html files
const softphoneHTML = path.join('file://', __dirname, 'softphone.html');
const configHTML = path.join('file://', __dirname, 'controlpanel.html');

// get data path
const userDataPath = path.join(app.getPath('userData'), 'config.json')

// Either retrieve existing data or use default values
var data;
try{
  data = JSON.parse(fs.readFileSync(userDataPath));
} catch {
  console.log('hi?')
}

data = data || JSON.parse(fs.readFileSync('./resources/defaults.json'))

console.log(data)

// const debug = require('electron-debug');

// debug();

app.on('ready', function(){
  openConfig();
});

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

  //the keycode values are recorded on the backend, thus those need to be updated in the data from the configuration page
  configData.keycode = data.keycode;
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
    // focus on window
    softphone.showInactive()
    softphone.focus();
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
    ipc.once('record', record);
    ioHook.removeAllListeners('keydown')
    ioHook.removeAllListeners('keyup')
  });

}
