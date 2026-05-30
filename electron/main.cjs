// Electron main process. Plain CommonJS so it loads cleanly even though
// the root package.json declares "type": "module" for Vite.
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !app.isPackaged && process.env.ELECTRON_RENDERER_URL;

let embeddedServer = null;
let embeddedServerError = null;

async function startEmbedded() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'firetools.db');
    const migrationsPath = path.join(app.getAppPath(), 'server', 'migrations');

    if (!fs.existsSync(migrationsPath)) {
      throw new Error(`Migrations directory not found at ${migrationsPath}`);
    }

    const embedModule = await import(
      require('node:url').pathToFileURL(
        path.join(app.getAppPath(), 'server', 'dist', 'embed.js')
      ).href
    );
    embeddedServer = await embedModule.startEmbeddedServer({
      dbPath,
      migrationsPath,
      host: '127.0.0.1',
      corsAllowAll: true,
    });
    console.log(
      `[fire-tools] embedded backend started at ${embeddedServer.url} (db: ${embeddedServer.dbPath})`
    );
  } catch (err) {
    embeddedServerError = err && err.message ? err.message : String(err);
    console.error('[fire-tools] failed to start embedded backend:', err);
  }
}

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

ipcMain.handle('fire-tools:embedded-backend-info', () => ({
  url: embeddedServer ? embeddedServer.url : null,
  dbPath: embeddedServer ? embeddedServer.dbPath : null,
  error: embeddedServerError,
}));

app.whenReady().then(async () => {
  await startEmbedded();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async (event) => {
  if (!embeddedServer) return;
  const server = embeddedServer;
  embeddedServer = null;
  event.preventDefault();
  try {
    await server.close();
  } catch (err) {
    console.error('[fire-tools] error closing embedded backend:', err);
  }
  app.quit();
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

