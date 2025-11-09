const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    },
    show: false
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../public/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

ipcMain.handle('audio:initialize', async () => {
  return { success: true, message: 'Audio engine initialized' };
});

ipcMain.handle('audio:process', async (event, audioData) => {
  return { success: true, processedData: audioData };
});

ipcMain.handle('vst:load', async (event, vstPath) => {
  return { success: true, message: `VST3 plugin loaded: ${vstPath}` };
});

ipcMain.handle('vst:getParameters', async () => {
  return { success: true, parameters: [] };
});

ipcMain.handle('vst:setParameter', async (event, paramId, value) => {
  return { success: true, paramId, value };
});