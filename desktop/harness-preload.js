const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('deepSeekHarnessDesktop', {
  isDesktop: true,
  platform: process.platform,
  getConfig: () => ipcRenderer.invoke('harness-config:get'),
  saveConfig: (payload) => ipcRenderer.invoke('harness-config:save', payload),
  startMode: (mode) => ipcRenderer.invoke('harness-mode:start', mode),
  retry: () => ipcRenderer.invoke('harness-connection:retry'),
})
