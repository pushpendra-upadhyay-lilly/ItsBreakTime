// src/renderer/stores/activityStore.ts
import { writable, derived } from 'svelte/store';

export interface ActivityState {
  isIdle: boolean;
  isFullscreen: boolean;
  lastActivityTime: number; // timestamp of last user activity
  idleThreshold: number; // milliseconds before considered idle (default: 3 min)
}

const defaultState: ActivityState = {
  isIdle: false,
  isFullscreen: false,
  lastActivityTime: Date.now(),
  idleThreshold: 3 * 60 * 1000 // 3 minutes
};

export const activityState = writable<ActivityState>(defaultState);

// Derived: is timer eligible to show break (not idle & not fullscreen)
export const shouldShowBreak = derived(activityState, ($state) => {
  return !$state.isIdle && !$state.isFullscreen;
});

// Derived: display reason if break is suppressed
export const breakSuppressReason = derived(activityState, ($state) => {
  if ($state.isIdle) return 'User is idle';
  if ($state.isFullscreen) return 'Fullscreen app detected';
  return null;
});
