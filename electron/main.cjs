// Electron main process. Plain CommonJS so it loads cleanly even though
// the root package.json declares "type": "module" for Vite.
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged && process.env.ELECTRON_RENDERER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0A0B0E',
    autoHideMenuBar: true,
    title: 'Fire Tools',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Open external links in the default browser, not in the Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist-electron', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Hardening: block creation of unauthorized webContents and navigation outside the app.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const allowedDevOrigin = process.env.ELECTRON_RENDERER_URL;
    const isDevOrigin = allowedDevOrigin && navigationUrl.startsWith(allowedDevOrigin);
    const isFileOrigin = navigationUrl.startsWith('file://');
    if (!isDevOrigin && !isFileOrigin) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});
