import { app, BrowserWindow, Menu, nativeImage, Tray, ipcMain, screen } from 'electron';
import path from 'path';
import Store from 'electron-store';

// Define the store schema with TypeScript types
export interface StoreSchema {
  theme: 'light' | 'dark' | 'system';
  breakInterval: number;
  breakDuration: number;
  timerSettings?: {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
  };
}

// Initialize electron-store with proper typing
const store = new Store<StoreSchema>({
  name: 'itsbreaktime-settings',
  defaults: {
    theme: 'light',
    breakInterval: 20,
    breakDuration: 20,
    timerSettings: {
      workDuration: 20,
      breakDuration: 20,
      longBreakDuration: 5,
      longBreakInterval: 4
    }
  },
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let breakOverlayWindows: BrowserWindow[] = [];
let isBreakActive = false;
let currentBreakDuration = 0;
let breakStartTime = 0;
let breakBroadcastInterval: NodeJS.Timeout | null = null;

const isDev = process.env.NODE_ENV !== 'production';
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

// REGISTER IPC HANDLERS IMMEDIATELY (before window creation)
ipcMain.handle('store-get', (_event, key: keyof StoreSchema) => {
  // console.log('[IPC HANDLER] store-get called with key:', key);
  const value = store.get(key);
  // console.log('[IPC HANDLER] store-get returning:', value);
  return value;
});

ipcMain.handle('store-set', (_event, key: keyof StoreSchema, value: unknown) => {
  // console.log('[IPC HANDLER] store-set called with key:', key, 'value:', value);
  store.set(key, value);
  // console.log('[IPC HANDLER] store-set completed, store now:', store.store);
});

ipcMain.handle('store-delete', (_event, key: keyof StoreSchema) => {
  // console.log('[IPC HANDLER] store-delete called with key:', key);
  store.delete(key);
});

ipcMain.handle('store-has', (_event, key: keyof StoreSchema) => {
  // console.log('[IPC HANDLER] store-has called with key:', key);
  return store.has(key);
});

function getRemainingBreakTime(): number {
  if (!isBreakActive || breakStartTime === 0) return currentBreakDuration;

  const elapsed = Math.floor((Date.now() - breakStartTime) / 1000);
  const remaining = Math.max(0, currentBreakDuration - elapsed);
  return remaining;
}

function broadcastBreakTimer() {
  const remaining = getRemainingBreakTime();

  breakOverlayWindows.forEach((overlayWindow) => {
    if (!overlayWindow.isDestroyed() && !overlayWindow.webContents.isLoading()) {
      overlayWindow.webContents.send('break:timer-update', {
        remaining
      });
    }
  });

  // Stop broadcasting when time is up
  if (remaining <= 0) {
    if (breakBroadcastInterval) {
      clearInterval(breakBroadcastInterval);
      breakBroadcastInterval = null;
    }

    setTimeout(() => {
      hideBreakOverlay();
    }, 100);
  }
}

function createBreakOverlays() {
  // Close existing overlays
  breakOverlayWindows.forEach(win => {
    if (!win.isDestroyed()) {
      if (win.isFocused()) win.blur();
      win.hide();
      win.setFullScreen(false);
      win.close();
    }
  });
  breakOverlayWindows = [];

  const displays = screen.getAllDisplays();

  console.log(`[Break] Creating overlays for ${displays.length} display(s)`);

  displays.forEach((display, index) => {
    const { x, y, width, height } = display.bounds;

    const overlayWindow = new BrowserWindow({
      x,
      y,
      width,
      height,
      show: false,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load break overlay HTML
    if (isDev) {
      overlayWindow.loadURL(`${VITE_DEV_SERVER_URL}#/break`);
    } else {
      overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: 'break'
      });
    }

    // macOS: Make window float above fullscreen apps
    if (process.platform === 'darwin') {
      app.dock?.hide();
      overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      overlayWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
      overlayWindow.setFullScreenable(true);
      app.dock?.show();
    }

    // Windows/Linux: Use kiosk-like behavior
    if (process.platform !== 'darwin') {
      overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    }

    overlayWindow.once('closed', () => {
      const idx = breakOverlayWindows.indexOf(overlayWindow);
      if (idx > -1) {
        breakOverlayWindows.splice(idx, 1);
      }
    });

    breakOverlayWindows.push(overlayWindow);

    console.log(`[Break] Created overlay ${index + 1} at (${x}, ${y}) ${width}x${height}`);
  });
}

function showBreakOverlay(duration: number) {
  isBreakActive = true;
  currentBreakDuration = duration;
  breakStartTime = Date.now();

  if (breakOverlayWindows.length === 0) {
    createBreakOverlays();
  }

  breakOverlayWindows.forEach((overlayWindow) => {
    overlayWindow.webContents.once('did-finish-load', () => {
      overlayWindow.webContents.send('break:start', {
        duration: getRemainingBreakTime()
      });
    });

    if (!overlayWindow.webContents.isLoading()) {
      overlayWindow.webContents.send('break:start', {
        duration: getRemainingBreakTime()
      });
    }

    overlayWindow.show();
    overlayWindow.focus();
    overlayWindow.setFullScreen(true);
  });

  if (breakBroadcastInterval) {
    clearInterval(breakBroadcastInterval);
  }

  breakBroadcastInterval = setInterval(() => {
    broadcastBreakTimer();
  }, 100); // Update every 100ms for smooth display

  console.log(`[Break] Showing overlays on ${breakOverlayWindows.length} display(s), starting timer broadcast`);
}

function hideBreakOverlay() {
  if (!isBreakActive) {
    console.log('[Break] hideBreakOverlay called but break not active, skipping');
    return;
  }

  isBreakActive = false;
  currentBreakDuration = 0;
  breakStartTime = 0;

  if (breakBroadcastInterval) {
    clearInterval(breakBroadcastInterval);
    breakBroadcastInterval = null;
  }

  breakOverlayWindows.forEach((overlayWindow) => {
    if (!overlayWindow.isDestroyed()) {
      if (overlayWindow.isFocused()) overlayWindow.blur();
      overlayWindow.hide();
      overlayWindow.setFullScreen(false);
      overlayWindow.close();
    }
  });

  console.log(`[Break] Hidden ${breakOverlayWindows.length} overlay(s), timer broadcast stopped`);
}

ipcMain.on('timer:complete', (_event, data) => {
  const { isOnBreak } = data;

  if (isOnBreak) {
    // Show fullscreen break overlay
    const breakDuration = store.get('timerSettings')?.breakDuration || 20;
    showBreakOverlay(breakDuration);
  } else {
    // Break ended - hide overlay
    hideBreakOverlay();
  }
});

ipcMain.on('break:skip', () => {
  if (!isBreakActive) return;
  hideBreakOverlay();
  mainWindow?.webContents.send('break:skipped');
});

ipcMain.on('break:snooze', () => {
  if (!isBreakActive) return;
  hideBreakOverlay();
  mainWindow?.webContents.send('break:snoozed');
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900, //TODO: change to 400 later
    height: 500,
    show: false, // Hidden by default; show when ready
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Required for security
      nodeIntegration: false,
    },
  });

  // Load Vite dev server in dev, production build in prod
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools(); // Optional: auto-open DevTools
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to avoid flicker
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Prevent window close; hide instead (menubar behavior)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  // Use a template icon for macOS (monochrome 16x16 or 18x18 PNG)
  const iconPath = path.join(__dirname, '../../assets/trayTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);

  // macOS template icons should be Template images
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('ItsBreakTime');

  const contextMenu = Menu.buildFromTemplate([
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
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // macOS: Click tray icon to toggle window
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
    }
  });
}

// macOS: Hide dock icon to make it menubar-only
app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }

  createTray();
  createWindow();

  screen.on('display-added', () => {
    console.log('[Break] Display added');

    if (isBreakActive) {
      const displays = screen.getAllDisplays();
      const lastDisplay = displays[displays.length - 1];
      const { x, y, width, height } = lastDisplay.bounds;

      const overlayWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        show: false,
        frame: false,
        transparent: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
        },
      });

      if (isDev) {
        overlayWindow.loadURL(`${VITE_DEV_SERVER_URL}#/break`);
      } else {
        overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
          hash: 'break'
        });
      }

      if (process.platform === 'darwin') {
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
        overlayWindow.setVisibleOnAllWorkspaces(true, {
          visibleOnFullScreen: true,
        });
        overlayWindow.setFullScreenable(false);
      }

      overlayWindow.webContents.once('did-finish-load', () => {
        overlayWindow.webContents.send('break:start', {
          duration: getRemainingBreakTime()
        });
      });

      overlayWindow.once('ready-to-show', () => {
        overlayWindow.show();
        overlayWindow.focus();
        overlayWindow.setFullScreen(true);
      });

      breakOverlayWindows.push(overlayWindow);

      console.log(`[Break] Added overlay on new display with ${getRemainingBreakTime()}s remaining`);
    }
  });

  screen.on('display-removed', () => {
    console.log('[Break] Display removed');

    if (isBreakActive) {
      const displays = screen.getAllDisplays();

      // Remove overlays that are no longer on valid displays
      breakOverlayWindows = breakOverlayWindows.filter(win => {
        if (win.isDestroyed()) return false;

        const bounds = win.getBounds();
        const isValid = displays.some(display => {
          return Math.abs(bounds.x - display.bounds.x) < 100;
        });

        if (!isValid) {
          if (win.isFocused()) win.blur();
          win.hide();
          win.setFullScreen(false);
          win.close();
          console.log(`[Break] Removed overlay from disconnected display`);
        }
        return isValid;
      });

      console.log(`[Break] Overlays now on ${breakOverlayWindows.length} display(s)`);
    }
  });

});

// macOS: Re-show window on dock icon click (if dock is enabled later)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Ensure tray is not garbage collected
app.on('before-quit', () => {
  if (breakBroadcastInterval) {
    clearInterval(breakBroadcastInterval);
    breakBroadcastInterval = null;
  }
  breakOverlayWindows.forEach(win => {
    if (!win.isDestroyed()) {
      if (win.isFocused()) win.blur();
      win.setFullScreen(false);
      win.close();
    }
  });
  breakOverlayWindows = [];
  app.isQuitting = true;
});

