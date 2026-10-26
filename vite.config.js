import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { exec } from 'child_process';

function pingPlugin() {
  return {
    name: 'ping-plugin',
    configureServer(server) {
      server.middlewares.use('/api/ping', (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const host = url.searchParams.get('host');
        if (!host || !/^[a-zA-Z0-9.-]+$/.test(host)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'invalid host' }));
        }
        const cmd = process.platform === 'win32'
          ? `ping -n 1 -w 800 ${host}`
          : `ping -c 1 -W 1 ${host}`;
        exec(cmd, (err, stdout) => {
          const match = stdout ? stdout.match(/time[=<](\d+(?:\.\d+)?)ms/i) : null;
          const online = !err && match !== null;
          const time = match ? Math.round(parseFloat(match[1])) : null;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ host, online, time }));
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), pingPlugin()],
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
