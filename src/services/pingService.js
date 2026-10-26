/**
 * Ping helper service
 * Communicates with backend /api/ping (ICMP + TCP Port Probing + Sanction Check)
 * with graceful browser fetch fallback for public domains.
 */

export function cleanHost(rawHost) {
  if (!rawHost) return '';
  return rawHost
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .trim();
}

export async function pingHost(rawHost) {
  const host = cleanHost(rawHost);
  if (!host) {
    return { online: false, sanctioned: false, time: null };
  }

  // 1. Try local Vite dev server ping API (which supports ICMP, TCP probing and sanction detection)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`/api/ping?host=${encodeURIComponent(host)}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: Boolean(data.online),
        sanctioned: Boolean(data.sanctioned),
        method: data.method,
        port: data.port,
        time: typeof data.time === 'number' ? data.time : null
      };
    }
  } catch (err) {
    // Fall through to browser fallback
  }

  // 2. Fallback for public domains / web addresses when running without backend API
  const hostWithoutPort = host.split(':')[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort);
  if (!isIp) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const start = performance.now();

      const fetchRes = await fetch(`https://${host}`, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - start);
      return { online: true, sanctioned: false, time: elapsed };
    } catch (err) {
      return { online: false, sanctioned: false, time: null };
    }
  }

  return { online: false, sanctioned: false, time: null };
}
