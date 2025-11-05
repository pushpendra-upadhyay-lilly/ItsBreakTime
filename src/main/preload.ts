import { contextBridge, ipcRenderer } from 'electron';

/**
 * Why invoke instead of send?
- invoke is async and returns values (perfect for get).
- send is fire-and-forget (no return value).
*/

// Define the API surface exposed to renderer
const api = {
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: unknown) => {
      // console.log(`[PRELOAD] Setting store key: ${key} to value:`, value);
      return ipcRenderer.invoke('store-set', key, value);
    },
    delete: (key: string) => ipcRenderer.invoke('store-delete', key),
    has: (key: string) => ipcRenderer.invoke('store-has', key),
  },
};

// Expose protected API to renderer via contextBridge
contextBridge.exposeInMainWorld('api', api);
