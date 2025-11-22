const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readBookmarks: (url) => ipcRenderer.invoke('read-bookmarks', url),
  saveBookmarks: (data) => ipcRenderer.invoke('save-bookmarks', data),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  toggleDevTools: () => ipcRenderer.invoke('toggle-devtools'), // 添加切换开发者工具功能
  invoke: (channel, ...args) => {
    console.log('IPC调用:', channel, args);
    return ipcRenderer.invoke(channel, ...args);
  }  // 添加通用invoke方法并添加调试信息
});