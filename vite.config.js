import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  server: {
    proxy: {
      '/api/tgju': {
        target: 'https://call.tgju.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tgju/, '')
      },
      '/api/wallex': {
        target: 'https://api.wallex.ir',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wallex/, '')
      },
      '/api/tsetmc': {
        target: 'https://cdn.tsetmc.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tsetmc/, '')
      }
    }
  },
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    rollupOptions: {
      inlineDynamicImports: true
    }
  }
});
