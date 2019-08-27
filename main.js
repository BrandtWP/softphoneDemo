
let app, config, softphone
let {BrowserWindow} = require('electron')
app = require('electron').app
let ipc = require('electron').ipcMain
const path = require('path');
const ioHook = require(app.getAppPath() + '/resources/iohook/index');
fs = require('fs')

const softphoneHTML = path.join('file://', __dirname, 'softphone.html');
const configHTML = path.join('file://', __dirname, 'controlpanel.html');
const CHILD_PADDING = 50;

const defaults = {"keycode":[29,23],"name":"Arizona Bachus","pfp":"./resources/pfp.jpg","phone":"+31 6 2781 8132","ringtone":"./resources/ringtone.mp3","shortcut":"ctrl+i","url":"https://weu-it.4me-staging.com/sd?telephone=31204044142"};
const userDataPath = path.join(app.getPath('userData'), 'config.json')

console.log(userDataPath)

const debug = require('electron-debug');

debug();
  
function writeUserData(data) {
  fs.writeFileSync(userDataPath, JSON.stringify(data));
}

function readUserData(callback) {
  try {
    return JSON.parse(fs.readFileSync(userDataPath))
  } catch(error) {
    return defaults
  }
}

var keys = [29,23]

ioHook.start();

const openSoftphone = function (data) {
  
  softphone = new BrowserWindow({
    width: 502,
    height: 300,
    transparent: true,
    resizable:true,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });
  
  softphone.loadURL(softphoneHTML);

  softphone.once('ready-to-show', () => {
    softphone.show()
    softphone.webContents.send('config', data)
  })

  
  softphone.once('close', () => {
    softphone = null;
    ioHook.stop();
    ioHook.unload()
    
  });
};

const openConfig = function(){
  config = new BrowserWindow({
    width: 800,
    height: 500,
    webPreferences: {
      nodeIntegration: true
    },
    show:false,
  })

  config.loadURL(configHTML);
  config.once('ready-to-show', () => {
    config.show()
    config.webContents.send('userData', readUserData())
  })

  config.once('close', () => {
    config = null;
    ioHook.stop();
    ioHook.unload()
  });
  
  
  }
  
  

app.on('ready', function(){
  
  openConfig()
  
});


ipc.on('record', (event) => {

  console.log("recording")

  var keyCodes = []

  ioHook.start()


  ioHook.on("keydown",function(msg){
    keyCodes.push(msg.keycode)
  });

  ioHook.on("keyup",function(msg){
    keys = keyCodes;
    config.webContents.send('keyCodes', {codes: keyCodes})
    keyCodes = []
    ioHook.stop()
  });
});

ipc.on('submit', (event, data) => {


  console.log('submitted')
  console.log(data)
  data.keycode = keys;

  writeUserData(data)
  
  ioHook.start()
  
  ioHook.registerShortcut(keys, function(){
    ioHook.unregisterAllShortcuts();
    openSoftphone(data)
  });
  
});