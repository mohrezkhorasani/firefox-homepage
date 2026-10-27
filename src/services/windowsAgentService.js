/**
 * Service to communicate with the local Python Windows Tools Backend Agent
 * Default port: 23157 (falls back through ports 23157..23170 if needed)
 */

const START_PORT = 23157;
const MAX_PORT_ATTEMPTS = 15;

// Cache the working port once discovered
let cachedPort = null;

export async function findActiveAgentPort() {
  if (cachedPort) {
    try {
      const res = await fetch(`http://127.0.0.1:${cachedPort}/api/health`, {
        signal: AbortSignal.timeout(1000)
      });
      if (res.ok) return cachedPort;
    } catch {}
    cachedPort = null;
  }

  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset++) {
    const port = START_PORT + offset;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
        signal: AbortSignal.timeout(600)
      });
      if (res.ok) {
        cachedPort = port;
        return port;
      }
    } catch {}
  }

  return null;
}

export async function fetchSystemDrives() {
  const port = await findActiveAgentPort();
  if (!port) {
    throw new Error('سرویس پایتون ویندوز (port 23157) در دسترس نیست یا در حال راه‌اندازی است.');
  }

  const res = await fetch(`http://127.0.0.1:${port}/api/drives`, {
    signal: AbortSignal.timeout(3000)
  });

  if (!res.ok) {
    throw new Error(`خطا در دریافت وضعیت درایوها (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    port,
    ...data
  };
}

export async function fetchSystemInfo() {
  const port = await findActiveAgentPort();
  if (!port) return null;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/system`, {
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
