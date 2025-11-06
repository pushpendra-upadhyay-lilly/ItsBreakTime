<!-- src/renderer/components/BreakOverlay.svelte -->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { timerService } from '../services/timerService';

  let timeRemaining = 20; // seconds
  let messages = [
    '👀 Look away from the screen',
    '💧 Hydrate yourself',
    '🧘 Stretch your body',
    '🌬️ Take a deep breath',
    '👁️ Rest your eyes',
    '🚶 Walk around a bit',
  ];
  let currentMessage = messages[0];

  onMount(() => {
    if (window.electron?.ipcRenderer) {
      // Listen for initial break start
      window.electron.ipcRenderer.on('break:start', (_event, data) => {
        timeRemaining = data.duration;
        currentMessage = messages[Math.floor(Math.random() * messages.length)];
        console.log(`[BreakOverlay] Break started with ${timeRemaining}s`);
      });

      window.electron.ipcRenderer.on('break:timer-update', (_event, data) => {
        timeRemaining = data.remaining;

        if (timeRemaining <= 0) {
          console.log('[BreakOverlay] Break ended');
          timerService.start();
        }
      });
    }
  });

  onDestroy(() => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.removeAllListeners('break:start');
      window.electron.ipcRenderer.removeAllListeners('break:timer-update');
    }
  });

  function handleSkip() {
    timerService.skipBreak();
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('break:skip', true);
    }
  }

  function handleSnooze() {
    timerService.snoozeBreak();
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('break:snooze', true);
    }
  }

  $: formattedTime = `${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`;
</script>

<div class="break-overlay">
  <div class="content">
    <h1 class="message">{currentMessage}</h1>
    <p class="timer">{formattedTime}</p>

    <div class="actions">
      <button class="skip-btn" on:click={handleSkip}> Skip Break </button>
      <button class="snooze-btn" on:click={handleSnooze}> Snooze 5 min </button>
    </div>
  </div>
</div>

<style>
  .break-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .content {
    text-align: center;
    color: white;
    max-width: 800px;
    padding: 2rem;
  }

  .message {
    font-size: 4rem;
    font-weight: 800;
    margin: 0 0 2rem 0;
    line-height: 1.2;
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .timer {
    font-size: 6rem;
    font-weight: 900;
    font-family: 'Monaco', 'Courier New', monospace;
    margin: 2rem 0;
    text-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  }

  .actions {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    margin-top: 3rem;
  }

  .actions button {
    padding: 1rem 2.5rem;
    font-size: 1.2rem;
    font-weight: 600;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .skip-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .skip-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  .snooze-btn {
    background: rgba(0, 0, 0, 0.3);
    color: white;
    backdrop-filter: blur(10px);
  }

  .snooze-btn:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  /* Responsive for smaller screens */
  @media (max-width: 768px) {
    .message {
      font-size: 2.5rem;
    }

    .timer {
      font-size: 4rem;
    }

    .actions button {
      font-size: 1rem;
      padding: 0.75rem 2rem;
    }
  }
</style>
