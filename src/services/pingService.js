/**
 * Browser-Native Ping & Latency Prober Service
 * Measures actual network round-trip time (RTT) directly from the browser window
 * using fetch (mode: 'no-cors') and image probing.
 * Zero dependency on local Python backend for public internet domains (Google, Fiverr, etc.).
 */

export function cleanHost(rawHost) {
  if (!rawHost) return '';
  return rawHost
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .trim();
}

/**
 * Image-based ping fallback
 * Used when fetch encounters strict CORS or mixed-content policies.
 */
export function imagePing(targetUrl, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const start = performance.now();
    const img = new Image();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        img.src = '';
        resolve({ online: false, time: null, error: 'Timeout', method: 'browser-image' });
      }
    }, timeoutMs);

    img.onload = img.onerror = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        const elapsed = Math.round(performance.now() - start);
        // Any response (even error code from image parser) proves the host is reachable!
        resolve({
          online: true,
          time: Math.max(elapsed, 1),
          sanctioned: false,
          method: 'browser-image'
        });
      }
    };

    try {
      const u = new URL(targetUrl);
      u.searchParams.set('_mqa_img_ping', Date.now().toString());
      img.src = u.toString();
    } catch (e) {
      clearTimeout(timer);
      resolve({ online: false, time: null, error: e.message, method: 'browser-image' });
    }
  });
}

/**
 * Pure Browser-Native Ping
 * Executes directly inside the browser JS runtime without any Python backend.
 */
export async function browserPing(rawHost, timeoutMs = 3500) {
  if (!rawHost) {
    return { online: false, time: null, error: 'Empty host' };
  }

  let host = cleanHost(rawHost);

  // Map known targets to their optimal lightweight endpoints
  let targetUrl = '';
  const lower = host.toLowerCase();
  if (lower === 'google.com' || lower === 'www.google.com') {
    targetUrl = 'https://www.google.com/generate_204';
  } else if (lower === 'fiverr.com' || lower === 'www.fiverr.com') {
    targetUrl = 'https://www.fiverr.com/favicon.ico';
  } else if (lower === '1.1.1.1' || lower === 'cloudflare.com' || lower === 'www.cloudflare.com') {
    targetUrl = 'https://1.1.1.1/cdn-cgi/trace';
  } else if (lower === 'aparat.com' || lower === 'www.aparat.com') {
    targetUrl = 'https://www.aparat.com/favicon.ico';
  } else if (rawHost.startsWith('http://') || rawHost.startsWith('https://')) {
    targetUrl = rawHost.trim();
  } else {
    targetUrl = `https://${host}`;
  }

  // Add cache-busting timestamp so browser doesn't return cached response
  try {
    const parsed = new URL(targetUrl);
    parsed.searchParams.set('_bp', Date.now().toString());
    targetUrl = parsed.toString();
  } catch (e) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + `_bp=${Date.now()}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = performance.now();
  try {
    // mode: 'no-cors' sends the request and resolves immediately when headers arrive.
    // This measures the real TCP + TLS + TTFB roundtrip experienced by the browser!
    await fetch(targetUrl, {
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal
    });
    clearTimeout(timer);
    const duration = Math.round(performance.now() - start);
    return {
      online: true,
      time: Math.max(duration, 1),
      sanctioned: false,
      method: 'browser-fetch'
    };
  } catch (err) {
    clearTimeout(timer);

    // Fallback: Image Ping
    try {
      const imgRes = await imagePing(targetUrl, Math.max(timeoutMs - 500, 1500));
      if (imgRes.online) return imgRes;
    } catch (e2) {}

    return {
      online: false,
      time: null,
      sanctioned: false,
      error: err.name === 'AbortError' ? 'تایم‌اوت' : 'قطع',
      method: 'browser-fetch'
    };
  }
}

/**
 * Universal pingHost
 * By default runs pure browser ping for all public web targets (Google, Fiverr, etc.).
 * Only falls back to LAN checking for private internal IP ranges without HTTPS.
 */
export async function pingHost(rawHost, options = {}) {
  const host = cleanHost(rawHost);
  if (!host) {
    return { online: false, sanctioned: false, time: null };
  }

  // Check if target is a private LAN IP (e.g. 192.168.0.x)
  const isPrivateIp = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^127\./.test(host.split(':')[0]);

  // Public websites: ALWAYS execute directly in the browser! ZERO Python!
  if (!isPrivateIp || options.forceBrowser) {
    return await browserPing(rawHost, options.timeout || 3500);
  }

  // For internal LAN devices: try browser HTTP first
  try {
    const res = await browserPing(`http://${rawHost}`, 1800);
    if (res.online) return res;
  } catch (e) {}

  // LAN fallback only: Python port check for local office printers/servers
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://127.0.0.1:23159/api/ping?host=${encodeURIComponent(host)}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      return {
        online: Boolean(data.online),
        sanctioned: Boolean(data.sanctioned),
        time: typeof data.time === 'number' ? data.time : null,
        method: 'lan-check'
      };
    }
  } catch (err) {}

  return { online: false, sanctioned: false, time: null };
}
