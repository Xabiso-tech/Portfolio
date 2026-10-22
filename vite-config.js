
import { defineConfig } from 'vite';

export default defineConfig({
  // Repository name used by GitHub Pages
  base: '/Portfolio/',

  // Local development server
  server: {
    port: 5173,
    open: true,
  },

  // Production build settings
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
