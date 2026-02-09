import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages deployment
  // MUST match your GitHub Pages URL: username.github.io/repo-name/
  base: '/gtfs-transit-data-explorer/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['jszip', 'papaparse'],
        }
      }
    }
  },
  
  // Web Worker support
  worker: {
    format: 'es'
  },
  
  // Development server
  server: {
    port: 3000,
    open: true
  }
});
