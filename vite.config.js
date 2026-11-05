import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { exec } from 'child_process';
import net from 'net';

const COMMON_PORTS = [1940, 3389, 80, 443, 445, 135, 8080, 22, 9100, 139];
const SANCTION_DOMAINS = ['gemini.google.com', 'antigravity.google', 'aistudio.google.com', 'generativelanguage.googleapis.com'];

const AI_SANCTION_STRINGS = [
  'is not currently available in your country',
  "isn't currently available in your country",
  "isn't currently available",
  'is not available in your country',
  'not available in your country',
  'not currently available',
  'not supported in your country',
  "isn't supported in your country",
  'user location is not supported',
  'location is not supported',
  'unsupported country',
  'geographic restriction',
  'region is not supported',
  'country not supported',
  'country is not supported'
];

function checkAiSanctionDeep(host) {
  return new Promise((resolve) => {
    const probeUrl = host.toLowerCase().includes('gemini')
      ? 'https://gemini.google.com/'
      : host.toLowerCase().includes('antigravity')
      ? 'https://antigravity.google/'
      : `https://${host}/`;

    const cmd = `curl.exe -s -L -x http://127.0.0.1:10809 -m 3.5 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0" -w "\\n__DELIM__\\nHTTP_CODE:%{http_code}\\nTIME_TOTAL:%{time_total}\\nURL_EFFECTIVE:%{url_effective}" "${probeUrl}"`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 4 }, (err, stdout) => {
      if (!stdout || !stdout.includes('__DELIM__')) {
        // Fallback: try direct without proxy if proxy was down
        exec(`curl.exe -s -L -m 3.5 -A "Mozilla/5.0" -w "\\n__DELIM__\\nHTTP_CODE:%{http_code}\\nTIME_TOTAL:%{time_total}\\nURL_EFFECTIVE:%{url_effective}" "${probeUrl}"`, { maxBuffer: 1024 * 1024 * 4 }, (err2, stdout2) => {
          if (!stdout2 || !stdout2.includes('__DELIM__')) {
            return resolve({ host, online: false, sanctioned: false, time: null, error: 'Connection failed' });
          }
          parseAiOutput(host, probeUrl, stdout2, resolve);
        });
        return;
      }
      parseAiOutput(host, probeUrl, stdout, resolve);
    });
  });
}

function parseAiOutput(host, probeUrl, stdout, resolve) {
  const [body, metaStr] = stdout.split('__DELIM__');
  let httpCode = 0;
  let timeTotal = 0;
  let effectiveUrl = probeUrl;

  const lines = (metaStr || '').split('\n');
  for (const line of lines) {
    if (line.startsWith('HTTP_CODE:')) {
      httpCode = parseInt(line.split(':')[1].trim(), 10) || 0;
    } else if (line.startsWith('TIME_TOTAL:')) {
      timeTotal = parseFloat(line.split(':')[1].trim()) || 0;
    } else if (line.startsWith('URL_EFFECTIVE:')) {
      effectiveUrl = line.split(':')[1].trim();
    }
  }

  const latencyMs = Math.round(timeTotal * 1000) || 50;

  // 1. Status 403 or 451
  if (httpCode === 403 || httpCode === 451) {
    return resolve({
      host,
      online: false,
      sanctioned: true,
      time: null,
      httpCode,
      reason: `تحریم HTTP ${httpCode}`
    });
  }

  // 2. Redirect to unavailable
  if (effectiveUrl.toLowerCase().includes('/unavailable') || effectiveUrl.toLowerCase().includes('/error')) {
    return resolve({
      host,
      online: false,
      sanctioned: true,
      time: null,
      httpCode,
      reason: 'تحریم لوکیشن (ریدایرکت به unavailable)'
    });
  }

  // 3. Scan body for polite soft geo-block strings
  const bodyLower = (body || '').toLowerCase();
  for (const phrase of AI_SANCTION_STRINGS) {
    if (bodyLower.includes(phrase)) {
      return resolve({
        host,
        online: false,
        sanctioned: true,
        time: null,
        httpCode,
        reason: `تحریم لوکیشن (${phrase})`
      });
    }
  }

  // 4. Check Google GeoIP country in WIZ_global_data
  const m = body.match(/window\.WIZ_global_data\s*=\s*(\{.*?\});/);
  if (m) {
    const cm = m[1].match(/"vXmutd"\s*:\s*"\%\.\@\."([A-Z]{2})"/);
    if (cm && ['IR', 'CU', 'SY', 'KP'].includes(cm[1])) {
      return resolve({
        host,
        online: false,
        sanctioned: true,
        time: null,
        httpCode,
        country: cm[1],
        reason: `تحریم لوکیشن کشور (${cm[1]})`
      });
    }
  }

  // 5. Success
  if (httpCode >= 200 && httpCode < 400) {
    return resolve({
      host,
      online: true,
      sanctioned: false,
      time: Math.max(latencyMs, 20),
      httpCode,
      method: 'http-ai-probe'
    });
  }

  return resolve({
    host,
    online: false,
    sanctioned: false,
    time: null,
    httpCode,
    error: `HTTP ${httpCode}`
  });
}

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

function checkSanctionStatus(host) {
  return new Promise((resolve) => {
    const isTarget = SANCTION_DOMAINS.some((d) => host.toLowerCase().includes(d));
    if (!isTarget) return resolve({ sanctioned: false, httpCode: null });

    exec(`curl.exe -s -o NUL -w "%{http_code}" -m 2.5 "https://${host}"`, (err, stdout) => {
      const code = parseInt(stdout ? stdout.trim() : '0', 10);
      const sanctioned = code === 403 || code === 451;
      resolve({ sanctioned, httpCode: code });
    });
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

    // Special: AI Services (Gemini, Antigravity) undergo deep HTTP geo-sanction probe (never fake 1ms ICMP ping)
    const isAi = SANCTION_DOMAINS.some((d) => host.toLowerCase().includes(d));
    if (isAi) {
      const aiRes = await checkAiSanctionDeep(clean);
      return resolve(aiRes);
    }

    // 1. If explicit custom port given, probe it directly via TCP
    if (customPort) {
      const tcp = await checkTcpPort(host, customPort, 800);
      if (tcp.ok) {
        const { sanctioned, httpCode } = await checkSanctionStatus(host);
        return resolve({
          host: clean,
          online: true,
          sanctioned,
          httpCode,
          time: tcp.time,
          method: 'tcp-custom',
          port: customPort
        });
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
        const { sanctioned, httpCode } = await checkSanctionStatus(host);
        return resolve({
          host: clean,
          online: true,
          sanctioned,
          httpCode,
          time,
          method: 'icmp'
        });
      }

      // 3. Fallback: probe common service ports (RDP, Web, SMB, SSH, Printer)
      const tcpResults = await Promise.all(
        COMMON_PORTS.map((p) => checkTcpPort(host, p, 500))
      );
      const successful = tcpResults.find((r) => r.ok);
      if (successful) {
        const { sanctioned, httpCode } = await checkSanctionStatus(host);
        return resolve({
          host: clean,
          online: true,
          sanctioned,
          httpCode,
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

function apiProxyPlugin() {
  return {
    name: 'api-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        let targetUrl = urlObj.searchParams.get('url');

        let bodyChunks = [];
        req.on('data', (chunk) => bodyChunks.push(chunk));
        req.on('end', async () => {
          try {
            const rawBody = Buffer.concat(bodyChunks).toString();
            let payload = {};
            if (rawBody) {
              try {
                payload = JSON.parse(rawBody);
              } catch {
                payload = { body: rawBody };
              }
            }

            if (!targetUrl && payload.url) {
              targetUrl = payload.url;
            }

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'target url is required' }));
            }

            const method = payload.method || req.method || 'GET';
            const headers = payload.headers || {};
            const data = payload.body !== undefined
              ? (typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body))
              : undefined;

            const start = Date.now();
            const fetchRes = await fetch(targetUrl, {
              method,
              headers,
              body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : data
            });

            const elapsed = Date.now() - start;
            const contentType = fetchRes.headers.get('content-type') || '';
            const responseHeaders = {};
            fetchRes.headers.forEach((val, key) => {
              responseHeaders[key.toLowerCase()] = val;
            });

            let responseData;
            if (contentType.includes('application/json')) {
              responseData = await fetchRes.json();
            } else {
              const text = await fetchRes.text();
              try {
                responseData = JSON.parse(text);
              } catch {
                responseData = text;
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ok: fetchRes.ok,
              status: fetchRes.status,
              statusText: fetchRes.statusText,
              time: elapsed,
              headers: responseHeaders,
              data: responseData
            }));
          } catch (err) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              ok: false,
              status: 0,
              statusText: err.message || 'Connection Error',
              time: null,
              error: err.message
            }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), pingPlugin(), apiProxyPlugin()],
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
