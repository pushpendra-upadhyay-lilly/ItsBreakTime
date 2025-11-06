<script lang="ts">
  import { onMount } from 'svelte';
  import Settings from './components/Settings.svelte';
  import Timer from './components/Timer.svelte';
  import { applyTheme, getResolvedTheme } from './lib/theme';
  import { timerService } from './services/timerService';
  import type { Theme } from './stores/app';
  import { appStore } from './stores/app';

  let resolvedTheme: 'light' | 'dark' = 'light';
  let isReady = false;
  let showSettings = false; // Toggle between Timer and Settings view

  // Load saved theme from electron-store on mount
  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if ($appStore.theme === 'system') {
        resolvedTheme = getResolvedTheme();
      }
    };

    (async () => {
      const savedTheme = await window.api.store.get('theme');

      if (savedTheme) {
        applyTheme(savedTheme as Theme);
        appStore.setTheme(savedTheme as Theme);
      } else {
        applyTheme('system');
      }
    })().finally(() => {
      isReady = true;
      resolvedTheme = getResolvedTheme();
      mediaQuery.addEventListener('change', handleChange);
    });

    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('break:skipped', () => {
        timerService.skipBreak();
      });

      window.electron.ipcRenderer.on('break:snoozed', () => {
        timerService.snoozeBreak();
      });
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  });

  // React to theme changes and save to electron-store
  $: if (isReady) {
    applyTheme($appStore.theme);

    window.api.store
      .set('theme', $appStore.theme)
      .then(() => {
        // Theme saved
      })
      .catch((err) => console.error('[APP] Error saving theme:', err));

    resolvedTheme = getResolvedTheme();
  }

  function cycleTheme() {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf($appStore.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    appStore.setTheme(nextTheme);
  }
</script>

<main>
  <header>
    <h1>BreakMate</h1>
    <div class="header-controls">
      <!-- Toggle Settings Button -->
      <button
        class="settings-btn"
        on:click={() => (showSettings = !showSettings)}
        title="Toggle settings"
      >
        {showSettings ? '⬅️ Back' : '⚙️ Settings'}
      </button>

      <!-- Theme Toggle Button -->
      <button class="theme-toggle" on:click={cycleTheme} title="Toggle theme">
        {#if $appStore.theme === 'light'}
          ☀️ Light
        {:else if $appStore.theme === 'dark'}
          🌙 Dark
        {:else}
          🖥️ System
        {/if}
      </button>
    </div>
  </header>

  <div class="content">
    {#if showSettings}
      <Settings />
    {:else}
      <Timer />
    {/if}
  </div>
</main>

<style>
  :global(:root) {
    --bg-color: #ffffff;
    --text-color: #333333;
    --accent-color: #2196f3;
    --button-bg: #f0f0f0;
    --button-hover: #e0e0e0;
  }

  :global(:root[data-theme='dark']),
  :global(:root:not([data-theme])) {
    @media (prefers-color-scheme: dark) {
      --bg-color: #1e1e1e;
      --text-color: #eeeeee;
      --accent-color: #64b5f6;
      --button-bg: #2a2a2a;
      --button-hover: #3a3a3a;
    }
  }

  :global(:root[data-theme='dark']) {
    --bg-color: #1e1e1e;
    --text-color: #eeeeee;
    --accent-color: #64b5f6;
    --button-bg: #2a2a2a;
    --button-hover: #3a3a3a;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    background: var(--bg-color);
    color: var(--text-color);
    transition:
      background 0.3s ease,
      color 0.3s ease;
  }

  main {
    padding: 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .header-controls {
    display: flex;
    gap: 0.5rem;
  }

  .theme-toggle,
  .settings-btn {
    padding: 8px 16px;
    background: var(--button-bg);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-color);
    transition: background 0.2s ease;
  }

  .theme-toggle:hover,
  .settings-btn:hover {
    background: var(--button-hover);
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
