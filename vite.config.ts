import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  root: './src/renderer',
  publicDir: '../../public',
  base: './', // Use relative paths for Electron
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/src/renderer',
    },
  },
});
