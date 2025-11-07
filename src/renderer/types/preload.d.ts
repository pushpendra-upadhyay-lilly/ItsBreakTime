export interface IElectronAPI {
  store: {
    get: (key: StoreKey) => Promise<unknown>;
    set: (key: StoreKey, value: unknown) => Promise<void>;
    delete: (key: StoreKey) => Promise<void>;
    has: (key: StoreKey) => Promise<boolean>;
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
    __ELECTRON_IPC__: {
      invoke: (channel: string, data?: unknown) => Promise<unknown>;
      send: (channel: string, data?: unknown) => void;
    };
  }
}
