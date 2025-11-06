<!-- src/lib/components/Timer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { timerState, formattedTime } from '../stores/timer';
  import { timerService } from '../services/timerService';

  onMount(() => {
    timerService.start();

    return () => {
      timerService.pause();
    };
  });
</script>

<div class="timer-container">
  <div class="display">
    <p class="phase">{$timerState.isOnBreak ? '👀 Break Time' : '💼 Work Time'}</p>
    <p class="time">{$formattedTime}</p>
    <p class="stats">Breaks taken: {$timerState.totalBreaksTaken}</p>
  </div>

  <div class="controls">
    <button on:click={() => timerService.start()} disabled={$timerState.isRunning}> Start </button>
    <button on:click={() => timerService.pause()} disabled={!$timerState.isRunning}> Pause </button>
    <button on:click={() => timerService.reset()}>Reset</button>
  </div>

  {#if $timerState.isOnBreak}
    <div class="break-actions">
      <button on:click={() => timerService.snoozeBreak()} class="secondary">
        Snooze (5 min)
      </button>
      <button on:click={() => timerService.skipBreak()} class="secondary"> Skip Break </button>
    </div>
  {/if}
</div>

<style>
  .timer-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
  }

  .display {
    text-align: center;
  }

  .time {
    font-size: 3rem;
    font-weight: bold;
    font-family: 'Monaco', monospace;
  }

  .controls {
    display: flex;
    gap: 1rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    background: #007aff;
    color: white;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  button:hover:not(:disabled) {
    opacity: 0.8;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .break-actions {
    display: flex;
    gap: 1rem;
  }

  .secondary {
    background: #6c757d;
  }
</style>
