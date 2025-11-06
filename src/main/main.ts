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

// Break Timer IPC Handlers - Bridge to renderer's timerService
ipcMain.handle('break-timer:get-remaining', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return 0;

  try {
    const result = await mainWindow.webContents.executeJavaScript(`
      window.timerService?.breakTimerManager?.getBreakTimeRemaining() || 0
    `);
    return result;
  } catch (error) {
    console.error('[Break Timer] Error getting remaining time:', error);
    return 0;
  }
});

ipcMain.handle('break-timer:is-active', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;

  try {
    const result = await mainWindow.webContents.executeJavaScript(`
      window.timerService?.breakTimerManager?.isActive() || false
    `);
    return result;
  } catch (error) {
    console.error('[Break Timer] Error checking if active:', error);
    return false;
  }
});

function broadcastBreakTimer() {
  // Request remaining time from the centralized timer service
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.log('[Break Timer] Main window not available');
    return;
  }

  mainWindow.webContents.executeJavaScript(`
    window.timerService?.breakTimerManager?.getBreakTimeRemaining() || 0
  `).then((remaining: number) => {
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

        // Start work timer automatically after break ends
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.executeJavaScript(`
            window.timerService?.completeBreak()
          `).then(() => {
            console.log('[Break Timer] Work timer started automatically after break ended');
          }).catch((error) => {
            console.error('[Break Timer] Error starting work timer:', error);
          });
        }
      }, 100);
    }
  }).catch((error: Error) => {
    console.error('[Break Timer] Error broadcasting timer:', error);
  });
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
      fullscreenable: true, // Changed to true for kiosk mode
      kiosk: process.platform === 'darwin' ? false : true, // Kiosk mode on Windows/Linux
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

    // macOS: Make window float above fullscreen apps and appear on all Spaces
    if (process.platform === 'darwin') {
      app.dock?.hide();
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      overlayWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true,
      });
      overlayWindow.setFullScreenable(false);
      app.dock?.show();
    }

    // Windows/Linux: Use kiosk-like behavior
    if (process.platform !== 'darwin') {
      overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    }

    // Use ready-to-show event to ensure content is rendered before showing
    overlayWindow.once('ready-to-show', () => {
      console.log(`[Break] Overlay ${index + 1} ready to show`);
      // Don't show here - let showBreakOverlay control when to show
    });

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
  // Start the centralized break timer in the main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      window.timerService?.breakTimerManager?.startBreakTimer(${duration})
    `).catch((error: Error) => {
      console.error('[Break Timer] Error starting break timer:', error);
    });
  }

  if (breakOverlayWindows.length === 0) {
    createBreakOverlays();
  }

  // Get initial remaining time from timer service and send to overlays
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      window.timerService?.breakTimerManager?.getBreakTimeRemaining() || ${duration}
    `).then((remaining: number) => {
      breakOverlayWindows.forEach((overlayWindow) => {
        const showWindow = () => {
          console.log('[Break] Showing overlay window');
          // Give Svelte a moment to render after receiving the message
          setTimeout(() => {
            overlayWindow.show();
            overlayWindow.focus();

            // Use simpleFullScreen on macOS to prevent Space switching
            if (process.platform === 'darwin') {
              overlayWindow.setSimpleFullScreen(true);
              // Ensure it stays visible on all workspaces/Spaces
              overlayWindow.setVisibleOnAllWorkspaces(true, {
                visibleOnFullScreen: true,
              });
            } else {
              overlayWindow.setFullScreen(true);
            }
          }, 100);
        };

        const sendStartMessage = () => {
          console.log('[Break] Sending break:start message with', remaining, 'seconds');
          overlayWindow.webContents.send('break:start', {
            duration: remaining
          });
          showWindow();
        };

        // Wait for content to fully load before showing
        if (overlayWindow.webContents.isLoading()) {
          console.log('[Break] Waiting for overlay content to load...');
          overlayWindow.webContents.once('did-finish-load', () => {
            console.log('[Break] Overlay content loaded');
            // Wait a bit more for Svelte to mount and render
            setTimeout(sendStartMessage, 150);
          });
        } else {
          console.log('[Break] Overlay already loaded');
          sendStartMessage();
        }
      });
    }).catch((error: Error) => {
      console.error('[Break Timer] Error getting initial time:', error);
    });
  }

  if (breakBroadcastInterval) {
    clearInterval(breakBroadcastInterval);
  }

  breakBroadcastInterval = setInterval(() => {
    broadcastBreakTimer();
  }, 100); // Update every 100ms for smooth display

  console.log(`[Break] Showing overlays on ${breakOverlayWindows.length} display(s), starting timer broadcast`);
}

function hideBreakOverlay() {
  // Check if break is active via timer service
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      window.timerService?.breakTimerManager?.isActive() || false
    `).then((isActive: boolean) => {
      if (!isActive) {
        console.log('[Break] hideBreakOverlay called but break not active, skipping');
        return;
      }

      // Stop the centralized break timer
      mainWindow?.webContents.executeJavaScript(`
        window.timerService?.breakTimerManager?.stopBreakTimer()
      `).catch((error: Error) => {
        console.error('[Break Timer] Error stopping break timer:', error);
      });

      if (breakBroadcastInterval) {
        clearInterval(breakBroadcastInterval);
        breakBroadcastInterval = null;
      }

      breakOverlayWindows.forEach((overlayWindow) => {
        if (!overlayWindow.isDestroyed()) {
          if (overlayWindow.isFocused()) overlayWindow.blur();

          // Exit fullscreen mode based on platform
          if (process.platform === 'darwin') {
            overlayWindow.setSimpleFullScreen(false);
          } else {
            overlayWindow.setFullScreen(false);
          }

          overlayWindow.hide();
          overlayWindow.close();
        }
      });

      console.log(`[Break] Hidden ${breakOverlayWindows.length} overlay(s), timer broadcast stopped`);
    }).catch((error: Error) => {
      console.error('[Break Timer] Error checking if active:', error);
    });
  }
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
  // Check if break is active before proceeding
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      window.timerService?.breakTimerManager?.isActive() || false
    `).then((isActive: boolean) => {
      if (!isActive) return;
      hideBreakOverlay();
      mainWindow?.webContents.send('break:skipped');
    }).catch((error: Error) => {
      console.error('[Break Timer] Error in skip handler:', error);
    });
  }
});

ipcMain.on('break:snooze', () => {
  // Check if break is active before proceeding
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`
      window.timerService?.breakTimerManager?.isActive() || false
    `).then((isActive: boolean) => {
      if (!isActive) return;
      hideBreakOverlay();
      mainWindow?.webContents.send('break:snoozed');
    }).catch((error: Error) => {
      console.error('[Break Timer] Error in snooze handler:', error);
    });
  }
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
    // Keep dock hidden on macOS even when showing window
    if (process.platform === 'darwin') {
      app.dock?.hide();
    }
    mainWindow?.show();
  });

  // Prevent window close; hide instead (menubar behavior)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Keep dock hidden when window is shown
  mainWindow.on('show', () => {
    if (process.platform === 'darwin') {
      app.dock?.hide();
    }
  });

  // Keep dock hidden when window gains focus
  mainWindow.on('focus', () => {
    if (process.platform === 'darwin') {
      app.dock?.hide();
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
        // On macOS, ensure dock stays hidden even when showing window
        if (process.platform === 'darwin') {
          app.dock?.hide();
        }
        mainWindow?.show();
        mainWindow?.focus();
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
      // Ensure dock stays hidden when showing window via tray click
      if (process.platform === 'darwin') {
        app.dock?.hide();
      }
      mainWindow?.show();
      mainWindow?.focus();
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

    // Check if break is active via timer service
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`
        window.timerService?.breakTimerManager?.isActive() || false
      `).then((isActive: boolean) => {
        if (!isActive) return;

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

        // Get remaining time from timer service
        mainWindow?.webContents.executeJavaScript(`
          window.timerService?.breakTimerManager?.getBreakTimeRemaining() || 0
        `).then((remaining: number) => {
          overlayWindow.webContents.once('did-finish-load', () => {
            overlayWindow.webContents.send('break:start', {
              duration: remaining
            });
          });

          overlayWindow.once('ready-to-show', () => {
            overlayWindow.show();
            overlayWindow.focus();

            // Use simpleFullScreen on macOS to prevent Space switching
            if (process.platform === 'darwin') {
              overlayWindow.setSimpleFullScreen(true);
            } else {
              overlayWindow.setFullScreen(true);
            }
          });

          breakOverlayWindows.push(overlayWindow);

          console.log(`[Break] Added overlay on new display with ${remaining}s remaining`);
        }).catch((error: Error) => {
          console.error('[Break Timer] Error getting remaining time for new display:', error);
        });
      }).catch((error: Error) => {
        console.error('[Break Timer] Error checking if active for new display:', error);
      });
    }
  });

  screen.on('display-removed', () => {
    console.log('[Break] Display removed');

    // Check if break is active via timer service
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`
        window.timerService?.breakTimerManager?.isActive() || false
      `).then((isActive: boolean) => {
        if (!isActive) return;

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
      }).catch((error: Error) => {
        console.error('[Break Timer] Error checking if active for display removed:', error);
      });
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

