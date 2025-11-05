import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  breakActive: boolean;
}

function createAppStore() {
  const { subscribe, set, update } = writable<AppState>({
    theme: 'system',
    breakActive: false,
  });

  return {
    subscribe,
    setTheme: (theme: Theme) => update((state) => ({ ...state, theme })),
    setBreakActive: (active: boolean) => update((state) => ({ ...state, breakActive: active })),
    reset: () => set({ theme: 'system', breakActive: false }),
  };
}

export const appStore = createAppStore();
