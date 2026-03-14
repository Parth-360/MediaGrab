// ============================================================
//  MediaGrab — Electron Desktop Wrapper
//  Serves the exported Expo web bundle via a local HTTP server
//  so that API calls, fonts, and assets all load correctly.
// ============================================================

const { app, BrowserWindow, shell } = require('electron');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

// When packaged by electron-builder, web-build is placed in process.resourcesPath.
// When running from source (npm start in desktop/), it's in the parent folder.
const DIST_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'web-build')
  : path.join(__dirname, '..', 'web-build');

const PORT = 19999;   // internal port — not exposed outside localhost

// ── Minimal static-file server ────────────────────────────

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.mp4':   'video/mp4',
  '.mp3':   'audio/mpeg',
};

let server;

function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      try {
        const reqPath = new URL(req.url, `http://localhost:${PORT}`).pathname;
        let filePath  = path.join(DIST_DIR, reqPath);

        // Resolve directory → index.html
        if (!path.extname(filePath)) filePath = path.join(DIST_DIR, 'index.html');
        if (!fs.existsSync(filePath))   filePath = path.join(DIST_DIR, 'index.html');

        const ext  = path.extname(filePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': mime });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end(err.message);
      }
    });

    server.on('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });
}

// ── Electron window ───────────────────────────────────────

let mainWindow;

async function createWindow() {
  await startServer();

  mainWindow = new BrowserWindow({
    width:     430,
    height:    900,
    minWidth:  380,
    minHeight: 680,
    title:     'MediaGrab',
    // Use system window chrome (no custom frame needed for mobile-style app)
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      // Allow the app to make requests to external APIs
      webSecurity: true,
    },
  });

  // Load our locally-served Expo web bundle
  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);

  // Open external links in the system browser, not inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
