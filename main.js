let app, BrowserWindow;
BrowserWindow = require('electron').BrowserWindow;
const path = require('path');
const ioHook = require('./resources/iohook/index');

const MAIN_HTML = path.join('file://', __dirname, 'main.html');
const CHILD_PADDING = 50;

ioHook.start();
// ioHook.setDebug(true); // Uncomment this line for see all debug information from iohook

const CTRL = 29;
const ALT = 56;
const F7 = 65;


const onAppReady = function () {
  
  let parent = new BrowserWindow({
    width: 502,
    height: 300,
    transparent: true,
    resizable:false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
  }
  });
  
  parent.once('close', () => {
      parent = null;
      ioHook.unload()
      ioHook.stop();

  });
      
  parent.loadURL(MAIN_HTML);
};
    
    
app = require('electron').app

app.on('ready', function(){

  ioHook.registerShortcut([CTRL, F7], (keys) => {
    setTimeout(onAppReady, 500)
  });
  
});
      
      
