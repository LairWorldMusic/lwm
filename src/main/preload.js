const { contextBridge, ipcRenderer } = require('electron');

// Secure context bridge for IPC communication
contextBridge.exposeInMainWorld('electronAPI', {
  audio: {
    initialize: () => ipcRenderer.invoke('audio:initialize'),
    process: (audioData) => ipcRenderer.invoke('audio:process', audioData),
    getDevices: () => ipcRenderer.invoke('audio:getDevices'),
  },
  vst: {
    load: (vstPath) => ipcRenderer.invoke('vst:load', vstPath),
    getPlugins: () => ipcRenderer.invoke('vst:getPlugins'),
  },
  on: (channel, callback) => {
    const validChannels = [
      'audio:device-changed',
      'audio:error',
      'vst:loaded',
      'vst:error',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
