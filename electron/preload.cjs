const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('hydromindDesktop', {
  platform: process.platform,
})
