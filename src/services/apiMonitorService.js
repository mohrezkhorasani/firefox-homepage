/**
 * API Monitor Service
 * Handles fetching APIs (via local Vite proxy or direct browser fetch fallback),
 * extracting nested keys from JSON, and managing sample defaults.
 */

export const DEFAULT_APIS = [
  {
    id: 'api_github_status',
    title: 'وضعیت گیت‌هاب',
    url: 'https://www.githubstatus.com/api/v2/status.json',
    method: 'GET',
    headers: [],
    body: '',
    selectedKeys: ['status.description', 'status.indicator'],
    pinned: true
  },
  {
    id: 'api_ip_info',
    title: 'سرویس IP پابلیک',
    url: 'https://api.ipify.org?format=json',
    method: 'GET',
    headers: [],
    body: '',
    selectedKeys: ['ip'],
    pinned: true
  }
];

/**
 * Safely extracts a value from a nested JSON object using dot notation or array indices.
 * Example paths: "status.indicator", "data[0].price", "result.count"
 */
export function getNestedValue(obj, path) {
  if (obj === undefined || obj === null || !path) return undefined;
  try {
    const normalized = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
    const keys = normalized.split('.');
    let current = obj;
    for (const k of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[k];
    }
    return current;
  } catch {
    return undefined;
  }
}

/**
 * Recursively extracts selectable key paths from an object (up to maxDepth).
 */
export function extractSelectablePaths(obj, prefix = '', depth = 0, maxDepth = 4) {
  if (depth > maxDepth || obj === null || obj === undefined) return [];
  let paths = [];

  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      obj.slice(0, 2).forEach((item, index) => {
        const currentPath = prefix ? `${prefix}[${index}]` : `[${index}]`;
        if (typeof item === 'object' && item !== null) {
          paths = paths.concat(extractSelectablePaths(item, currentPath, depth + 1, maxDepth));
        } else {
          paths.push({ path: currentPath, value: item });
        }
      });
    }
  } else if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      if (val !== null && typeof val === 'object') {
        paths = paths.concat(extractSelectablePaths(val, currentPath, depth + 1, maxDepth));
      } else {
        paths.push({ path: currentPath, value: val });
      }
    }
  }

  return paths;
}

/**
 * Formats a value for display on the card
 */
export function formatParamValue(val) {
  if (val === undefined) return 'نامشخص';
  if (val === null) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/**
 * Determines the status light color for an extracted value
 */
export function getValueLightClass(val) {
  if (val === undefined || val === null || val === '') {
    return 'bg-gray-500/40 text-gray-400';
  }
  if (typeof val === 'boolean') {
    return val
      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
      : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]';
  }
  return 'bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.7)]';
}

/**
 * Executes an API fetch through local Vite proxy or direct fetch
 */
export async function executeApiCall(api) {
  const { url, method = 'GET', headers = [], body = '' } = api;
  if (!url) {
    return { ok: false, status: 0, statusText: 'آدرس URL وارد نشده است', time: null, data: null };
  }

  const headersObj = {};
  if (Array.isArray(headers)) {
    headers.forEach((h) => {
      if (h.key && h.key.trim()) {
        headersObj[h.key.trim()] = h.value || '';
      }
    });
  }

  // 1. Try local Vite dev server proxy to completely bypass browser CORS
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const proxyRes = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        method,
        headers: headersObj,
        body: ['POST', 'PUT'].includes(method.toUpperCase()) && body ? body : undefined
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (proxyRes.ok) {
      const result = await proxyRes.json();
      return {
        ok: Boolean(result.ok),
        status: result.status || (result.ok ? 200 : 500),
        statusText: result.statusText || (result.ok ? 'OK' : 'Error'),
        time: result.time || null,
        data: result.data || null,
        error: result.error || null
      };
    }
  } catch (err) {
    // Fall through to direct browser fetch
  }

  // 2. Direct browser fetch fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const start = performance.now();

    const fetchOptions = {
      method,
      headers: headersObj,
      signal: controller.signal
    };

    if (['POST', 'PUT'].includes(method.toUpperCase()) && body) {
      fetchOptions.body = body;
    }

    const res = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    const elapsed = Math.round(performance.now() - start);

    let parsedData = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      parsedData = await res.json();
    } else {
      const text = await res.text();
      try {
        parsedData = JSON.parse(text);
      } catch {
        parsedData = text;
      }
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
      time: elapsed,
      data: parsedData
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: err.name === 'AbortError' ? 'Timeout (مهلت به پایان رسید)' : (err.message || 'خطای اتصال / CORS'),
      time: null,
      data: null,
      error: err.message
    };
  }
}
