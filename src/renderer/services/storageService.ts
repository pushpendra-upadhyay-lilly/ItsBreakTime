// src/lib/services/storageService.ts
import Store from 'electron-store';
import type { TimerSettings } from '../stores/timer';

const store = new Store<{ timerSettings: TimerSettings }>({
  defaults: {
    timerSettings: {
      workDuration: 20,
      breakDuration: 20,
      longBreakDuration: 5,
      longBreakInterval: 4
    }
  }
});

export function loadSettings(): TimerSettings {
  return store.get('timerSettings');
}

export function saveSettings(settings: TimerSettings) {
  store.set('timerSettings', settings);
}
