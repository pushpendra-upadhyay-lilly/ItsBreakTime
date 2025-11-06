import { writable, derived } from 'svelte/store';
import { loadSettings, saveSettings } from '../services/storageService';


export interface TimerSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in seconds
  longBreakDuration: number; // in minutes (optional)
  longBreakInterval: number; // every N cycles
}

export interface TimerState {
  isRunning: boolean;
  isOnBreak: boolean;
  timeRemaining: number; // in seconds
  cycleCount: number; // track breaks taken
  totalBreaksTaken: number;
}

// Default settings
const defaultSettings: TimerSettings = {
  workDuration: 20, // 20 minutes
  breakDuration: 20, // 20 seconds
  longBreakDuration: 5, // 5 minutes
  longBreakInterval: 4 // every 4 cycles
};

const persistedSettings = await loadSettings();

const defaultState: TimerState = {
  isRunning: false,
  isOnBreak: false,
  timeRemaining: (persistedSettings?.workDuration || defaultSettings.workDuration) * 60,
  cycleCount: 0,
  totalBreaksTaken: 0
};

export const timerSettings = writable<TimerSettings>(persistedSettings || defaultSettings);
export const timerState = writable<TimerState>(defaultState);

// Derived store for formatted time display (MM:SS)
export const formattedTime = derived(timerState, ($state) => {
  const minutes = Math.floor($state.timeRemaining / 60);
  const seconds = $state.timeRemaining % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

// Auto-save when settings change
timerSettings.subscribe((settings) => {
  saveSettings(settings);
});