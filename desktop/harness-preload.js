const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('deepSeekHarnessDesktop', {
  isDesktop: true,
  platform: process.platform,
  getConfig: () => ipcRenderer.invoke('harness-config:get'),
  saveConfig: (payload) => ipcRenderer.invoke('harness-config:save', payload),
  startMode: (mode) => ipcRenderer.invoke('harness-mode:start', mode),
  retry: () => ipcRenderer.invoke('harness-connection:retry'),
  checkForUpdates: () => ipcRenderer.invoke('harness-update:check'),
  installPluginUpdate: () => ipcRenderer.invoke('harness-update:install-plugin'),
  installDesktopUpdate: () => ipcRenderer.invoke('harness-update:install-desktop'),
  openProject: () => ipcRenderer.invoke('harness-update:open-project'),
  onUpdateProgress: (callback) => {
    const listener = (_event, progress) => callback(progress)
    ipcRenderer.on('harness-update:progress', listener)
    return () => ipcRenderer.removeListener('harness-update:progress', listener)
  },
})
