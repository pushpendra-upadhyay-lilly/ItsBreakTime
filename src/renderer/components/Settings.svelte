<!-- src/lib/components/Settings.svelte -->
<script lang="ts">
  import { timerSettings } from '../stores/timer';
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
</div>

<style>
  .settings {
    padding: 2rem;
  }

  label {
    display: block;
    margin-bottom: 1rem;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 0.25rem;
  }
</style>
