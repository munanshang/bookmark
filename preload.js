const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readBookmarks: (url) => ipcRenderer.invoke('read-bookmarks', url),
  saveBookmarks: (data) => ipcRenderer.invoke('save-bookmarks', data),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config)
});