// src/renderer/services/timerService.ts
import { TimerState } from '../stores/timer';
import { timerState, timerSettings } from '../stores/timer';
import { get } from 'svelte/store';

export class TimerService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    const state = get<TimerState>(timerState);
    if (state.isRunning) return;

    timerState.update((s: TimerState) => ({ ...s, isRunning: true }));

    this.intervalId = setInterval(() => {
      timerState.update((state: TimerState) => {
        if (state.timeRemaining > 0) {
          return { ...state, timeRemaining: state.timeRemaining - 1 };
        } else {
          // Timer reached zero
          this.handleTimerComplete();
          return state;
        }
      });
    }, 1000); // tick every 1 second
  }

  pause() {
    timerState.update((s) => ({ ...s, isRunning: false }));
    if (this.intervalId) clearInterval(this.intervalId);
  }

  reset() {
    this.pause();
    const settings = get(timerSettings);
    const state = get(timerState);
    const newDuration = state.isOnBreak
      ? settings.breakDuration
      : settings.workDuration * 60;

    timerState.update((s) => ({
      ...s,
      timeRemaining: newDuration,
      isRunning: false
    }));
  }

  private handleTimerComplete() {
    this.pause();
    const state = get(timerState);
    const nextIsOnBreak = !state.isOnBreak;

    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('timer:complete', {
        isOnBreak: nextIsOnBreak
      });
    }

    // Update state
    const settings = get(timerSettings);
    const newDuration = nextIsOnBreak
      ? settings.breakDuration
      : settings.workDuration * 60;

    timerState.update((s) => ({
      ...s,
      isOnBreak: nextIsOnBreak,
      timeRemaining: newDuration,
      cycleCount: nextIsOnBreak ? s.cycleCount + 1 : s.cycleCount,
      totalBreaksTaken: nextIsOnBreak ? s.totalBreaksTaken + 1 : s.totalBreaksTaken
    }));
  }

  skipBreak() {
    const settings = get(timerSettings);
    timerState.update((s) => ({
      ...s,
      isOnBreak: false,
      timeRemaining: settings.workDuration * 60
    }));
  }

  snoozeBreak() {
    const settings = get(timerSettings);
    timerState.update((s) => ({
      ...s,
      timeRemaining: settings.workDuration * 60,
      isOnBreak: false
    }));
    this.start();
  }
}

export const timerService = new TimerService();
