// src/renderer/services/timerService.ts
import { TimerState } from '../stores/timer';
import { timerState, timerSettings } from '../stores/timer';
import { get } from 'svelte/store';

export class TimerService {
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    const state = get<TimerState>(timerState);
    console.log(`[TimerService] Starting timer`, state.isRunning);
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
    const settings = get(timerSettings);

    // Determine next state
    const wasOnBreak = state.isOnBreak;
    const nextIsOnBreak = !wasOnBreak;

    const newCycleCount = wasOnBreak ? state.cycleCount : state.cycleCount + 1;
    const newBreaksTaken = wasOnBreak ? state.totalBreaksTaken + 1 : state.totalBreaksTaken;

    // Send notification to main process
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('timer:complete', {
        isOnBreak: nextIsOnBreak
      });
    }

    // Calculate new duration
    const newDuration = nextIsOnBreak
      ? settings.breakDuration
      : settings.workDuration * 60;

    // Update state
    timerState.update((s) => ({
      ...s,
      isRunning: false,
      isOnBreak: nextIsOnBreak,
      timeRemaining: newDuration,
      cycleCount: newCycleCount,
      totalBreaksTaken: newBreaksTaken
    }));

    if (!nextIsOnBreak) {
      setTimeout(() => this.start(), 500);
    }
  }

  skipBreak() {
    const settings = get(timerSettings);
    timerState.update((s) => ({
      ...s,
      isOnBreak: false,
      isRunning: false,
      timeRemaining: settings.workDuration * 60,
      totalBreaksTaken: s.totalBreaksTaken + 1
    }));

    setTimeout(() => this.start(), 500);
  }

  snoozeBreak() {
    const settings = get(timerSettings);

    timerState.update((s) => ({
      ...s,
      timeRemaining: settings.workDuration * 60,
      isOnBreak: false,
      isRunning: false
    }));

    setTimeout(() => this.start(), 500);
  }
}

export const timerService = new TimerService();
