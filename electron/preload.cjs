// Preload runs in an isolated world with access to a limited Node surface.
// Keep this file minimal — every API exposed here is reachable from the
// renderer and must be considered an attack surface.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('fireTools', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
