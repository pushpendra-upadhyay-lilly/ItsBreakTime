// src/renderer/types/electron.d.ts
export interface IElectronAPI {
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    has: (key: string) => Promise<boolean>;
  };
  autoLaunch: {
    enable: () => Promise<{ success: boolean; error?: string }>;
    disable: () => Promise<{ success: boolean; error?: string }>;
    isEnabled: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    api: IElectronAPI;
    electron?: {
      ipcRenderer: {
        send: (channel: string, data: any) => void;
        on: (channel: string, func: (event: any, data: any) => void) => void;
        removeAllListeners: (channel: string) => void;
      };
    };
  }
}
