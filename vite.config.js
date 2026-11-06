import { defineConfig } from 'vite';

// base './' keeps the built folder portable (served from any path).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2500 },
});
