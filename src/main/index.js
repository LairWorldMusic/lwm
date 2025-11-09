const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Channels for audio processing
ipcMain.handle('audio:initialize', async () => {
  try {
    return {
      success: true,
      message: 'Audio engine initialized',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('audio:process', async (event, audioData) => {
  try {
    // Audio processing will be implemented here
    return {
      success: true,
      processed: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('audio:getDevices', async () => {
  try {
    // Will return available audio devices
    return {
      success: true,
      devices: [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('vst:load', async (event, vstPath) => {
  try {
    // VST3 loading will be implemented here
    return {
      success: true,
      loaded: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('vst:getPlugins', async () => {
  try {
    // Will return list of available VST3 plugins
    return {
      success: true,
      plugins: [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});
