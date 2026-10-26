/**
 * Ping helper service
 * Communicates with backend /api/ping (via native ICMP ping)
 * with graceful browser fetch fallback for public domains.
 */

export function cleanHost(rawHost) {
  if (!rawHost) return '';
  return rawHost
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .trim();
}

export async function pingHost(rawHost) {
  const host = cleanHost(rawHost);
  if (!host) {
    return { online: false, time: null };
  }

  // 1. Try local Vite dev server ping API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`/api/ping?host=${encodeURIComponent(host)}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: Boolean(data.online),
        time: typeof data.time === 'number' ? data.time : null
      };
    }
  } catch (err) {
    // Vite /api/ping unavailable or timed out; fall through to browser fallback
  }

  // 2. Fallback for public domains when running without backend API
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (!isIp) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const start = performance.now();

      await fetch(`https://${host}`, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - start);
      return { online: true, time: elapsed };
    } catch (err) {
      return { online: false, time: null };
    }
  }

  return { online: false, time: null };
}
