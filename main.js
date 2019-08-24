let app, config, softphone
let {BrowserWindow} = require('electron')
let ipc = require('electron').ipcMain
const path = require('path');
const ioHook = require('./resources/iohook/index');
fs = require('fs')

const softphoneHTML = path.join('file://', __dirname, 'softphone.html');
const configHTML = path.join('file://', __dirname, 'controlpanel.html');
const CHILD_PADDING = 50;

var keys = [29,23]

ioHook.start();

const openSoftphone = function (data) {
  
  softphone = new BrowserWindow({
    width: 502,
    height: 300,
    transparent: true,
    resizable:false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  
  softphone.loadURL(softphoneHTML);

  softphone.webContents.send('config', {config: data})
  
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
    }
  })

  config.loadURL(configHTML);

  config.once('close', () => {
    config = null;
    // ioHook.stop();
    // ioHook.unload()
  });
  
  
  }
  
  
  app = require('electron').app

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

  fs.writeFileSync('./resources/config.json', JSON.stringify(data))
  
  ioHook.start()
  
  ioHook.registerShortcut(keys, (keys) => {
    ioHook.unregisterAllShortcuts();
    setTimeout(openSoftphone(data), 500)
  });
  
})
