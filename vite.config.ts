import { defineConfig } from 'vite';

export default defineConfig(({mode})=>({
  // Browser checks and the live preview must not invalidate each other's optimized modules.
  cacheDir:mode==='browser-test'?'node_modules/.vite-browser-test':'node_modules/.vite',
}));