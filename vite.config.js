import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages deployment
  // Change this to match your repository name
  base: '/transit-data-explorer/',
  
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
