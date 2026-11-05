/**
 * Ping & Sanction Prober Service
 * Integrates with:
 *   1. Python Network Route & Sanction Service on port 23159 (/api/ping)
 *   2. Vite dev server proxy (/api/ping)
 * Performs deep geo-restriction inspection for Gemini & Antigravity
 * (detects soft messages like "is not currently available in your country").
 */

const AI_DOMAINS = ['gemini.google.com', 'antigravity.google', 'aistudio.google.com', 'generativelanguage.googleapis.com'];

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

  const isAiDomain = AI_DOMAINS.some((d) => host.toLowerCase().includes(d));

  // 1. Try Python Site IP & Route Inspector Service on port 23159 (Has real VPN core inspection & deep HTTP curl)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`http://127.0.0.1:23159/api/ping?host=${encodeURIComponent(host)}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: Boolean(data.online) && !Boolean(data.sanctioned),
        sanctioned: Boolean(data.sanctioned),
        reason: data.reason || null,
        method: data.method,
        port: data.port,
        time: data.sanctioned ? null : (typeof data.time === 'number' ? data.time : null)
      };
    }
  } catch (err) {
    // Fall through to Vite dev server
  }

  // 2. Try local Vite dev server ping API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`/api/ping?host=${encodeURIComponent(host)}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: Boolean(data.online) && !Boolean(data.sanctioned),
        sanctioned: Boolean(data.sanctioned),
        reason: data.reason || null,
        method: data.method,
        port: data.port,
        time: data.sanctioned ? null : (typeof data.time === 'number' ? data.time : null)
      };
    }
  } catch (err) {
    // Fall through to browser fallback
  }

  // 3. For AI Domains: If backend is unreachable, NEVER show a fake 1ms ping!
  if (isAiDomain) {
    return {
      online: false,
      sanctioned: false,
      time: null,
      error: 'سرویس بررسی تحریم در دسترس نیست'
    };
  }

  // 4. Fallback for generic public web domains
  const hostWithoutPort = host.split(':')[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort);
  if (!isIp) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const start = performance.now();

      await fetch(`https://${host}`, {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - start);
      return { online: true, sanctioned: false, time: Math.max(elapsed, 10) };
    } catch (err) {
      return { online: false, sanctioned: false, time: null };
    }
  }

  return { online: false, sanctioned: false, time: null };
}
