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

/**
 * Fetch all Windows Services (cached in Python agent for fast response)
 */
export async function fetchServicesList(forceRefresh = false) {
  const port = await findActiveAgentPort();
  if (!port) throw new Error('سرویس پایتون در دسترس نیست.');

  const url = `http://127.0.0.1:${port}/api/services${forceRefresh ? '?refresh=true' : ''}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`خطا در دریافت لیست سرویس‌ها (HTTP ${res.status})`);
  return await res.json();
}

/**
 * Fetch real-time status of specific pinned services
 */
export async function fetchServicesDetails(names) {
  if (!names || names.length === 0) return [];
  const port = await findActiveAgentPort();
  if (!port) return [];

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/services/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names }),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.services || [];
  } catch {
    return [];
  }
}

/**
 * Start / Stop / Restart a Windows Service
 */
export async function controlService(serviceName, action) {
  const port = await findActiveAgentPort();
  if (!port) throw new Error('سرویس پایتون در دسترس نیست.');

  const res = await fetch(`http://127.0.0.1:${port}/api/services/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service: serviceName, action }),
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok) throw new Error(`خطا در اجرای عملیات سرویس (HTTP ${res.status})`);
  return await res.json();
}

/**
 * Fetch all Windows Scheduled Tasks
 */
export async function fetchTasksList(forceRefresh = false) {
  const port = await findActiveAgentPort();
  if (!port) throw new Error('سرویس پایتون در دسترس نیست.');

  const url = `http://127.0.0.1:${port}/api/tasks${forceRefresh ? '?refresh=true' : ''}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`خطا در دریافت لیست تسک‌ها (HTTP ${res.status})`);
  return await res.json();
}

/**
 * Fetch detailed info for pinned scheduled tasks
 */
export async function fetchTasksDetails(names) {
  if (!names || names.length === 0) return [];
  const port = await findActiveAgentPort();
  if (!port) return [];

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/tasks/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names }),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tasks || [];
  } catch {
    return [];
  }
}

/**
 * Run / End / Enable / Disable a Scheduled Task
 */
export async function controlTask(taskName, action) {
  const port = await findActiveAgentPort();
  if (!port) throw new Error('سرویس پایتون در دسترس نیست.');

  const res = await fetch(`http://127.0.0.1:${port}/api/tasks/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: taskName, action }),
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) throw new Error(`خطا در اجرای عملیات تسک (HTTP ${res.status})`);
  return await res.json();
}
