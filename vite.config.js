import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { exec } from 'child_process';
import net from 'net';

const COMMON_PORTS = [1940, 3389, 80, 443, 445, 135, 8080, 22, 9100, 139];

function checkTcpPort(host, port, timeout = 450) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeout);
    socket.on('connect', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve({ ok: true, time: Date.now() - start, port });
      }
    });
    socket.on('error', (err) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        // ECONNREFUSED means the host actively replied with TCP RST -> host is alive!
        if (err.code === 'ECONNREFUSED') {
          resolve({ ok: true, time: Date.now() - start, port, rst: true });
        } else {
          resolve({ ok: false });
        }
      }
    });
    socket.on('timeout', () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve({ ok: false });
      }
    });
    socket.connect(port, host);
  });
}

function probeTarget(rawHost) {
  return new Promise(async (resolve) => {
    let clean = rawHost.trim().replace(/^https?:\/\//i, '').split('/')[0].trim();
    let host = clean;
    let customPort = null;

    if (clean.includes(':')) {
      const parts = clean.split(':');
      host = parts[0];
      const parsedPort = parseInt(parts[1], 10);
      if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
        customPort = parsedPort;
      }
    }

    if (!host || !/^[a-zA-Z0-9.-]+$/.test(host)) {
      return resolve({ host: rawHost, online: false, time: null, error: 'invalid host' });
    }

    // 1. If explicit custom port given, probe it directly via TCP
    if (customPort) {
      const tcp = await checkTcpPort(host, customPort, 800);
      if (tcp.ok) {
        return resolve({ host: clean, online: true, time: tcp.time, method: 'tcp-custom', port: customPort });
      }
    }

    // 2. Try ICMP ping (500ms timeout)
    const cmd = process.platform === 'win32'
      ? `ping -n 1 -w 500 ${host}`
      : `ping -c 1 -W 1 ${host}`;

    exec(cmd, async (err, stdout) => {
      const match = stdout ? stdout.match(/time[=<](\d+(?:\.\d+)?)ms/i) : null;
      if (!err && match) {
        const time = Math.round(parseFloat(match[1])) || 1;
        return resolve({ host: clean, online: true, time, method: 'icmp' });
      }

      // 3. Fallback: probe common service ports (RDP, Web, SMB, SSH, Printer)
      const tcpResults = await Promise.all(
        COMMON_PORTS.map((p) => checkTcpPort(host, p, 500))
      );
      const successful = tcpResults.find((r) => r.ok);
      if (successful) {
        return resolve({
          host: clean,
          online: true,
          time: successful.time || 1,
          method: 'tcp-fallback',
          port: successful.port
        });
      }

      return resolve({ host: clean, online: false, time: null });
    });
  });
}

function pingPlugin() {
  return {
    name: 'ping-plugin',
    configureServer(server) {
      server.middlewares.use('/api/ping', async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const host = url.searchParams.get('host');
        if (!host) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'host is required' }));
        }

        const result = await probeTarget(host);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(result));
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
