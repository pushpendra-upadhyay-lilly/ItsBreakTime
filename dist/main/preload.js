"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Why invoke instead of send?
- invoke is async and returns values (perfect for get).
- send is fire-and-forget (no return value).
*/
// Define the API surface exposed to renderer
const api = {
    store: {
        get: (key) => electron_1.ipcRenderer.invoke('store-get', key),
        set: (key, value) => {
            // console.log(`[PRELOAD] Setting store key: ${key} to value:`, value);
            return electron_1.ipcRenderer.invoke('store-set', key, value);
        },
        delete: (key) => electron_1.ipcRenderer.invoke('store-delete', key),
        has: (key) => electron_1.ipcRenderer.invoke('store-has', key),
    },
};
// Expose protected API to renderer via contextBridge
electron_1.contextBridge.exposeInMainWorld('api', api);
