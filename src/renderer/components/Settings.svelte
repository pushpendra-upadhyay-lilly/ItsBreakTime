<!-- src/lib/components/Settings.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { timerSettings } from '../stores/timer';

  let autoLaunchEnabled = $state(false);
  let isLoadingAutoLaunch = $state(true);

  onMount(async () => {
    // Load current auto-launch status
    if (window.api?.autoLaunch) {
      try {
        const isEnabled = await window.api.autoLaunch.isEnabled();
        console.log('[Settings] Loaded auto-launch status:', isEnabled);
        autoLaunchEnabled = isEnabled;
      } catch (error) {
        console.error('[Settings] Failed to load auto-launch status:', error);
      } finally {
        isLoadingAutoLaunch = false;
      }
    } else {
      console.warn('[Settings] autoLaunch API not available');
      isLoadingAutoLaunch = false;
    }
  });

  async function toggleAutoLaunch(event: Event) {
    if (!window.api?.autoLaunch) return;

    const checkbox = event.target as HTMLInputElement;
    const newValue = checkbox.checked;

    try {
      if (newValue) {
        // Trying to enable
        const result = await window.api.autoLaunch.enable();
        if (!result.success) {
          console.error('[Settings] Failed to enable auto-launch:', result.error);
          autoLaunchEnabled = false; // Revert on failure
        } else {
          console.log('[Settings] Auto-launch enabled successfully');
          autoLaunchEnabled = true;
        }
      } else {
        // Trying to disable
        const result = await window.api.autoLaunch.disable();
        if (!result.success) {
          console.error('[Settings] Failed to disable auto-launch:', result.error);
          autoLaunchEnabled = true; // Revert on failure
        } else {
          console.log('[Settings] Auto-launch disabled successfully');
          autoLaunchEnabled = false;
        }
      }
    } catch (error) {
      console.error('[Settings] Error toggling auto-launch:', error);
      autoLaunchEnabled = !newValue; // Revert on error
    }
  }
</script>

<div class="settings">
  <h2>Timer Settings</h2>

  <label>
    Work Duration (minutes):
    <input type="number" min="1" max="60" bind:value={$timerSettings.workDuration} />
  </label>

  <label>
    Break Duration (seconds):
    <input type="number" min="1" max="300" bind:value={$timerSettings.breakDuration} />
  </label>

  <label>
    Long Break Duration (minutes):
    <input type="number" min="1" max="30" bind:value={$timerSettings.longBreakDuration} />
  </label>

  <label>
    Long Break Every N cycles:
    <input type="number" min="1" max="10" bind:value={$timerSettings.longBreakInterval} />
  </label>

  <h2>App Settings</h2>

  <label class="checkbox-label">
    <input
      type="checkbox"
      bind:checked={autoLaunchEnabled}
      onchange={toggleAutoLaunch}
      disabled={isLoadingAutoLaunch}
    />
    Start BreakMate automatically when you log in
  </label>
</div>

<style>
  .settings {
    padding: 2rem;
  }

  h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  h2:first-child {
    margin-top: 0;
  }

  label {
    display: block;
    margin-bottom: 1rem;
  }

  input[type='number'] {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  input[type='checkbox'] {
    width: auto;
    margin: 0;
    cursor: pointer;
  }

  input[type='checkbox']:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
