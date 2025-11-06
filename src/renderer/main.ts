// src/renderer/main.ts (or wherever you initialize your app)
import { mount } from 'svelte';
import App from './App.svelte';
import BreakOverlay from './components/BreakOverlay.svelte';

const target = document.getElementById('app')!;

// Simple hash-based routing
const hash = window.location.hash;

if (hash === '#/break') {
  mount(BreakOverlay, { target });
} else {
  mount(App, { target });
}

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
