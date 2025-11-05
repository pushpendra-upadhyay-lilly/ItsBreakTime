"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_store_1 = __importDefault(require("electron-store"));
// Initialize electron-store with proper typing
const store = new electron_store_1.default({
    name: 'itsbreaktime-settings',
    defaults: {
        theme: 'light',
        breakInterval: 20,
        breakDuration: 20,
    },
});
let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV !== 'production';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
// ✅ REGISTER IPC HANDLERS IMMEDIATELY (before window creation)
electron_1.ipcMain.handle('store-get', (_event, key) => {
    // console.log('[IPC HANDLER] store-get called with key:', key);
    const value = store.get(key);
    // console.log('[IPC HANDLER] store-get returning:', value);
    return value;
});
electron_1.ipcMain.handle('store-set', (_event, key, value) => {
    // console.log('[IPC HANDLER] store-set called with key:', key, 'value:', value);
    store.set(key, value);
    // console.log('[IPC HANDLER] store-set completed, store now:', store.store);
});
electron_1.ipcMain.handle('store-delete', (_event, key) => {
    // console.log('[IPC HANDLER] store-delete called with key:', key);
    store.delete(key);
});
electron_1.ipcMain.handle('store-has', (_event, key) => {
    // console.log('[IPC HANDLER] store-has called with key:', key);
    return store.has(key);
});
// Listen from renderer process
electron_1.ipcMain.on('timer:complete', (_event, data) => {
    const { isOnBreak } = data;
    const notification = new electron_1.Notification({
        title: isOnBreak ? 'Break Time! 🎉' : 'Back to Work! 💼',
        body: isOnBreak
            ? 'Look away from the screen. Relax your eyes!'
            : 'Time to get back to work.',
        // sound: true,
        urgency: 'critical'
    });
    notification.show();
    notification.on('click', () => {
        mainWindow?.show();
        mainWindow?.focus();
    });
});
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 900, //TODO: change to 400 later
        height: 500,
        show: false, // Hidden by default; show when ready
        resizable: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true, // Required for security
            nodeIntegration: false,
        },
    });
    // Load Vite dev server in dev, production build in prod
    if (isDev) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools(); // Optional: auto-open DevTools
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
    // Show window when ready to avoid flicker
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // Prevent window close; hide instead (menubar behavior)
    mainWindow.on('close', (event) => {
        if (!electron_1.app.isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
}
function createTray() {
    // Use a template icon for macOS (monochrome 16x16 or 18x18 PNG)
    const iconPath = path_1.default.join(__dirname, '../../assets/trayTemplate.png');
    const icon = electron_1.nativeImage.createFromPath(iconPath);
    // macOS template icons should be Template images
    icon.setTemplateImage(true);
    tray = new electron_1.Tray(icon);
    tray.setToolTip('ItsBreakTime');
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Open ItsBreakTime',
            click: () => {
                mainWindow?.show();
            },
        },
        {
            label: 'Take Break Now',
            enabled: false, // Stub for Phase 1
            click: () => {
                // console.log('Break triggered');
            },
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.isQuitting = true;
                electron_1.app.quit();
            },
        },
    ]);
    tray.setContextMenu(contextMenu);
    // macOS: Click tray icon to toggle window
    tray.on('click', () => {
        if (mainWindow?.isVisible()) {
            mainWindow.hide();
        }
        else {
            mainWindow?.show();
        }
    });
}
// macOS: Hide dock icon to make it menubar-only
electron_1.app.whenReady().then(() => {
    if (process.platform === 'darwin') {
        electron_1.app.dock?.hide();
    }
    createTray();
    createWindow();
});
// macOS: Re-show window on dock icon click (if dock is enabled later)
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
    else {
        mainWindow?.show();
    }
});
// Quit when all windows are closed (except on macOS)
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Ensure tray is not garbage collected
electron_1.app.on('before-quit', () => {
    electron_1.app.isQuitting = true;
});
// app.on('ready', () => {
//   session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
//     callback({
//       responseHeaders: {
//         ...details.responseHeaders,
//         'Content-Security-Policy': ['default-src \'none\'']
//       }
//     })
//   });
// });
