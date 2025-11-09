const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  initializeAudio: () => ipcRenderer.invoke('audio:initialize'),
  processAudio: (audioData) => ipcRenderer.invoke('audio:process', audioData),
  loadVST: (vstPath) => ipcRenderer.invoke('vst:load', vstPath),
  getVSTParameters: () => ipcRenderer.invoke('vst:getParameters'),
  setVSTParameter: (paramId, value) => ipcRenderer.invoke('vst:setParameter', paramId, value),
  onAudioProcess: (callback) => ipcRenderer.on('audio-process', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  log: (...args) => console.log('[Renderer]', ...args),
  error: (...args) => console.error('[Renderer]', ...args)
});