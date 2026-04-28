import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'HydroSim',
      formats: ['iife'],
      fileName: () => 'hydrosim.js'
    },
    outDir: 'dist',
    // Do NOT inline the WASM binary — it is served separately via nginx
    assetsInlineLimit: 0,
    rollupOptions: {
      // No external deps — fully self-contained IIFE
      external: [],
      output: {
        // Ensure no hash in filename so nginx location block is stable
        entryFileNames: 'hydrosim.js',
        assetFileNames: '[name].[ext]'
      }
    },
    minify: true,
    sourcemap: false
  }
});
