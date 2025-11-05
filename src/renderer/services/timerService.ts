// src/lib/services/timerService.ts
import { timerState, timerSettings } from '../stores/timer';
import { get } from 'svelte/store';

export class TimerService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    const state = get(timerState);
    if (state.isRunning) return; // Already running

    timerState.update((s) => ({ ...s, isRunning: true }));

    this.intervalId = setInterval(() => {
      timerState.update((state) => {
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
    const newDuration = get(timerState).isOnBreak
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

    // Send notification via IPC
    if (window.__ELECTRON_IPC__) {
      window.__ELECTRON_IPC__.invoke('timer:complete', {
        isOnBreak: !state.isOnBreak
      });
    }

    // Trigger notification (we'll implement this in Step 3)
    timerState.update((s) => ({
      ...s,
      isOnBreak: !s.isOnBreak, // toggle work/break
      cycleCount: s.isOnBreak ? s.cycleCount : s.cycleCount + 1,
      totalBreaksTaken: s.isOnBreak ? s.totalBreaksTaken + 1 : s.totalBreaksTaken
    }));
  }

  skipBreak() {
    this.reset();
    timerState.update((s) => ({ ...s, isOnBreak: false }));
  }

  snoozeBreak() {
    // Snooze for 5 minutes before showing break again
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
