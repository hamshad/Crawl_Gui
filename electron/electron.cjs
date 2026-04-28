const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: true,
    backgroundColor: '#0a0a0f',
    show: false,
  });

  // Load files from dist folder (same directory as electron.cjs)
  const distPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Loading:', distPath);
  
  mainWindow.loadFile(distPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('App shown!');
  });

  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});