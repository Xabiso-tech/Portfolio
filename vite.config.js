import { defineConfig } from 'vite';

/**
 * Vite configuration for TECH'STAMENT.
 *
 * The site is published from the `main` branch through GitHub Actions
 * (see .github/workflows/deploy.yml). Because the repository is served from a
 * sub-path, `base` must match the repository name exactly. Getting this wrong
 * is the single most common cause of "CSS loads but JavaScript 404s" on
 * GitHub Pages, so it is kept in one obvious place.
 */
export default defineConfig({
  base: '/Portfolio/',

  // Vite dev server. `open` is disabled so the dev server can run headless
  // during automated checks without spawning a browser window.
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false,
    // Chrome keeps its QA profile locked while browser checks run.
    watch: { ignored: ['**/.qa/**'] },
  },

  preview: {
    port: 4173,
    host: '127.0.0.1',
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split the two heavy runtime dependencies so the intro can start
        // painting while Three.js is still being parsed. Vite 8 bundles
        // with Rolldown, which takes the chunk map as a function.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
          return undefined;
        },
      },
    },
  },
});
