/**
 * VPN Subscription & Happ Routing Service
 * Handles multi-subscription management, traffic parsing,
 * extraction of server nodes/IPs from subscription data,
 * and automatic detection of the active subscription based on connected proxy IP.
 */

export const HAPP_ROUTING_URL =
  'happ://routing/add/ewogICAgIkJsb2NrSXAiOiBbCiAgICBdLAogICAgIkJsb2NrU2l0ZXMiOiBbCiAgICBdLAogICAgIkRpcmVjdElwIjogWwogICAgICAgICIxMC4wLjAuMC84IiwKICAgICAgICAiMTcyLjE2LjAuMC8xMiIsCiAgICAgICAgIjE5Mi4xNjguMC4wLzE2IiwKICAgICAgICAiMTY5LjI1NC4wLjAvMTYiLAogICAgICAgICIyMjQuMC4wLjAvNCIKICAgIF0sCiAgICAiRGlyZWN0U2l0ZXMiOiBbCiAgICAgICAgIjI1NS4yNTUuMjU1LjI1NWdlb2lwOmlyIiwKICAgICAgICAiZ2Vvc2l0ZTpjYXRlZ29yeS1pciIsCiAgICAgICAgImRvbWFpbjppciIsCiAgICAgICAgIlBST0NFU1MtTkFNRTpmaXJlZm94LmV4ZSIsCiAgICAgICAgIlBST0NFU1MtTkFNRTpjaHJvbWUuZXhlIiwKICAgICAgICAiUFJPQ0VTUy1OQU1FOm1zZWRnZS5leGUiCiAgICBdLAogICAgIkRuc0hvc3RzIjogewogICAgICAgICJjbG91ZGZsYXJlLWRucy5jb20iOiAiMS4xLjEuMSIsCiAgICAgICAgImRucy5nb29nbGUiOiAiOC44LjguOCIKICAgIH0sCiAgICAiRG9tYWluU3RyYXRlZ3kiOiAiSVBJZk5vbk1hdGNoIiwKICAgICJEb21lc3RpY0ROU0RvbWFpbiI6ICJodHRwczovL2Rucy5nb29nbGUvZG5zLXF1ZXJ5IiwKICAgICJEb21lc3RpY0ROU0lQIjogIjguOC44LjgiLAogICAgIkRvbWVzdGljRE5TVHlwZSI6ICJEb1UiLAogICAgIkZha2VETlMiOiAiZmFsc2UiLAogICAgIkdlb2lwdXJsIjogImh0dHBzOi8vZ2l0aHViLmNvbS9Mb3lhbHNvbGRpZXIvdjJyYXktcnVsZXMtZGF0L3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9nZW9pcC5kYXQiLAogICAgIkdlb3NpdGV1cmwiOiAiaHR0cHM6Ly9naXRodWIuY29tL0xveWFsc29sZGllci92MnJheS1ydWxlcy1kYXQvcmVsZXMvbGF0ZXN0L2Rvd25sb2FkL2dlb3NpdGUuZGF0IiwKICAgICJHbG9iYWxQcm94eSI6ICJmYWxzZSIsCiAgICAiTGFzdFVwZGF0ZWQiOiAxNzkyODI0MDUwLAogICAgIk5hbWUiOiAiRGVmYXVsdCIsCiAgICAiUHJveHlJcCI6IFsKICAgIF0sCiAgICAiUHJveHlTaXRlcyI6IFsKICAgICAgICAiZG9tYWluOmdlbWluaS5nb29nbGUuY29tIiwKICAgICAgICAiZG9tYWluOmFpc3R1ZGlvLmdvb2dsZS5jb20iLAogICAgICAgICJkb21haW46Z2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tIiwKICAgICAgICAiZG9tYWluOmFudGlncmF2aXR5Lmdvb2dsZSIsCiAgICAgICAgImRvbWFpbjpkYWlseS1jbG91ZGNvZGUtcGEuZ29vZ2xlYXBpcy5jb20iLAogICAgICAgICJkb21haW46Y2xvdWRjb2RlLXBhLmdvb2dsZWFwaXMuY29tIiwKICAgICAgICAiZG9tYWluOmFjY291bnRzLmdvb2dsZS5jb20iLAogICAgICAgICJkb21haW46b2F1dGgyLmdvb2dsZWFwaXMuY29tIiwKICAgICAgICAiZG9tYWluOndlYi50ZWxlZ3JhbS5vcmciLAogICAgICAgICJkb21haW46aXBhcGkuY28iLAogICAgICAgICJkb21haW46cm92ZXItbG9vbS5jb20iLAogICAgICAgICJkb21haW46c3Vic2NyaXB0aW9uLnNpbWNoaW4udG9wIiwKICAgICAgICAiZG9tYWluOmFwaS5pcC5zYiIsCiAgICAgICAgImRvbWFpbjp3aGF0aXNteWlwLmNvbSIsCiAgICAgICAgIlBST0NFU1MtTkFNRTpBbnRpZ3Jhdml0eS5leGUiLAogICAgICAgICJQUk9DRVNTLU5BTUU6bGFuZ3VhZ2Vfc2VydmVyLmV4ZSIsCiAgICAgICAgImdlb3NpdGU6R09PR0xFLUdFTUlOSSIsCiAgICAgICAgImdlb3NpdGU6R09PR0xFIiwKICAgICAgICAiZ2Vvc2l0ZTpHT09HTEUtVFJVU1QtU0VSVklDRVMiLAogICAgICAgICJnZW9zaXRlOkdPT0dMRS1SRUdJU1RSWSIsCiAgICAgICAgImdlb3NpdGU6R09PR0xFLVJFR0lTVFJZLVRMRCIKICAgIF0sCiAgICAiUmVtb3RlRE5TRG9tYWluIjogImh0dHBzOi8vY2xvdWRmbGFyZS1kbnMuY29tL2Rucy1xdWVyeSIsCiAgICAiUmVtb3RlRE5TSVAiOiAiMS4xLjEuMSIsCiAgICAiUmVtb3RlRE5TVHlwZSI6ICJEb0giLAogICAgIlJvdXRlT3JkZXIiOiAiYmxvY2stcHJveHktZGlyZWN0Igp9Cg==';

/**
 * Format bytes into human-readable Persian/English text
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

/**
 * Safe Base64 decoding (UTF-8 compatible)
 */
export function decodeBase64Safe(input) {
  if (!input || typeof input !== 'string') return '';
  try {
    let str = input.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    if (typeof window !== 'undefined' && window.atob) {
      const decoded = window.atob(str);
      try {
        return decodeURIComponent(
          decoded
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } catch {
        return decoded;
      }
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'base64').toString('utf8');
    }
  } catch {
    // Return empty on decoding error
  }
  return '';
}

/**
 * Parse Subscription-Userinfo header string:
 * e.g. "upload=123456; download=654321; total=107374182400; expire=1735689600"
 */
export function parseSubscriptionUserInfo(headerStr) {
  if (!headerStr || typeof headerStr !== 'string') return null;

  const result = {
    upload: 0,
    download: 0,
    total: 0,
    expire: null
  };

  const parts = headerStr.split(';');
  for (const part of parts) {
    const [rawKey, rawVal] = part.split('=').map((s) => (s ? s.trim() : ''));
    if (!rawKey || !rawVal) continue;
    const key = rawKey.toLowerCase();
    const val = parseInt(rawVal, 10);
    if (isNaN(val)) continue;

    if (key === 'upload') result.upload = val;
    else if (key === 'download') result.download = val;
    else if (key === 'total') result.total = val;
    else if (key === 'expire') result.expire = val;
  }

  const used = result.upload + result.download;
  const total = result.total;
  const remaining = total > 0 ? Math.max(0, total - used) : 0;
  const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const percentRemaining = Math.max(0, 100 - percentUsed);

  let daysLeft = null;
  let expireFormatted = null;
  if (result.expire && result.expire > 0) {
    const expireMs = result.expire * 1000;
    const diffMs = expireMs - Date.now();
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    try {
      expireFormatted = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(expireMs));
    } catch {
      expireFormatted = new Date(expireMs).toLocaleDateString();
    }
  }

  return {
    upload: result.upload,
    download: result.download,
    total,
    expire: result.expire,
    used,
    remaining,
    percentUsed,
    percentRemaining,
    daysLeft,
    expireFormatted,
    usedText: formatBytes(used),
    remainingText: formatBytes(remaining),
    totalText: formatBytes(total)
  };
}

/**
 * Extract server addresses/hostnames/IPs from subscription data (base64 or raw)
 */
export function extractServersFromSubData(data) {
  const servers = new Set();
  if (!data) return [];

  let text = typeof data === 'string' ? data : JSON.stringify(data);

  // If text is base64 encoded list of links, try to decode it
  if (!text.includes('vmess://') && !text.includes('vless://') && !text.includes('ss://') && !text.includes('trojan://')) {
    const decoded = decodeBase64Safe(text);
    if (decoded && (decoded.includes('://') || decoded.includes('{'))) {
      text = decoded;
    }
  }

  // Split into lines or config blocks
  const lines = text.split(/[\r\n]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // vmess:// base64 JSON
    if (trimmed.startsWith('vmess://')) {
      const b64 = trimmed.substring(8);
      const jsonStr = decodeBase64Safe(b64);
      try {
        const obj = JSON.parse(jsonStr);
        if (obj.add) servers.add(String(obj.add).toLowerCase().trim());
        if (obj.host) servers.add(String(obj.host).toLowerCase().trim());
        if (obj.sni) servers.add(String(obj.sni).toLowerCase().trim());
      } catch {}
    }
    // vless://, trojan://, ss://, hysteria://
    else if (trimmed.includes('://')) {
      try {
        const urlStr = trimmed.replace(/#.*$/, ''); // remove hash title
        const parsed = new URL(urlStr);
        if (parsed.hostname) {
          servers.add(parsed.hostname.toLowerCase().trim());
        }
        const sni = parsed.searchParams.get('sni') || parsed.searchParams.get('host');
        if (sni) {
          servers.add(sni.toLowerCase().trim());
        }
      } catch {}
    }
  }

  return Array.from(servers);
}

/**
 * Storage helpers for multi-subscriptions
 */
const STORAGE_KEY_LIST = 'homepage_vpn_sub_list_v2';
const STORAGE_KEY_ACTIVE = 'homepage_vpn_active_sub_id';
const STORAGE_KEY_MANUAL_BINDINGS = 'homepage_vpn_ip_bindings'; // { [ip]: subId }

export function getSavedVpnSubs() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_LIST);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate old single sub if exists
      const oldRaw = localStorage.getItem('homepage_vpn_sub_data');
      if (oldRaw) {
        const old = JSON.parse(oldRaw);
        if (old && old.subUrl) {
          const item = {
            id: 'sub_' + Date.now(),
            subUrl: old.subUrl,
            title: old.title || 'کانفیگ ۱',
            lastChecked: old.lastChecked || Date.now(),
            traffic: old.traffic || null,
            servers: []
          };
          localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify([item]));
          return [item];
        }
      }
    }
  } catch (e) {
    console.error('Failed to get saved VPN subs:', e);
  }
  return [];
}

export function saveVpnSubs(list) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(list));
  }
}

export function getActiveSubId() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY_ACTIVE) || null;
  }
  return null;
}

export function setActiveSubId(id) {
  if (typeof localStorage !== 'undefined') {
    if (id) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }
}

export function getIpBindings() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_MANUAL_BINDINGS);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return {};
}

/**
 * Manually connect/bind a specific IP to a Subscription
 */
export function bindIpToSub(ip, subId) {
  if (!ip || !subId) return;
  const cleanIp = String(ip).trim().toLowerCase();
  const bindings = getIpBindings();
  bindings[cleanIp] = subId;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_MANUAL_BINDINGS, JSON.stringify(bindings));
  }
  // Also add this IP to the sub's known servers array so it persists permanently
  const list = getSavedVpnSubs();
  const targetSub = list.find((s) => s.id === subId);
  if (targetSub) {
    if (!Array.isArray(targetSub.servers)) targetSub.servers = [];
    if (!targetSub.servers.includes(cleanIp)) {
      targetSub.servers.push(cleanIp);
      saveVpnSubs(list);
    }
  }
  setActiveSubId(subId);
}

/**
 * Fetch and refresh a single VPN Subscription
 */
export async function fetchVpnSubTraffic(subUrl, title = '', existingId = null) {
  if (!subUrl || !subUrl.trim()) {
    throw new Error('لطفاً آدرس لینک ساب را وارد کنید.');
  }

  const cleanUrl = subUrl.trim();
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(cleanUrl)}`;

  const res = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Happ/3.0.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  if (!res.ok) {
    throw new Error(`خطای سرور: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.ok && json.status === 0) {
    throw new Error(json.statusText || 'خطا در برقراری ارتباط با لینک ساب');
  }

  let userInfoHeader = null;
  if (json.headers) {
    for (const [k, v] of Object.entries(json.headers)) {
      if (k.toLowerCase() === 'subscription-userinfo') {
        userInfoHeader = v;
        break;
      }
    }
  }

  let traffic = null;
  if (userInfoHeader) {
    traffic = parseSubscriptionUserInfo(userInfoHeader);
  } else if (json.data && typeof json.data === 'object') {
    const d = json.data;
    if (d.upload !== undefined || d.download !== undefined || d.total !== undefined) {
      const str = `upload=${d.upload || 0}; download=${d.download || 0}; total=${d.total || 0}; expire=${d.expire || 0}`;
      traffic = parseSubscriptionUserInfo(str);
    }
  }

  if (!traffic) {
    traffic = {
      upload: 0,
      download: 0,
      total: 0,
      expire: null,
      used: 0,
      remaining: 0,
      percentUsed: 0,
      percentRemaining: 100,
      daysLeft: null,
      expireFormatted: 'نامحدود / تعریف نشده',
      usedText: 'نامشخص',
      remainingText: 'فعال',
      totalText: 'نامحدود'
    };
  }

  // Extract server hosts/IPs from the subscription body
  const servers = extractServersFromSubData(json.data);

  const list = getSavedVpnSubs();
  const id = existingId || ('sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));

  const newSub = {
    id,
    subUrl: cleanUrl,
    title: title.trim() || `کانفیگ ${list.length + 1}`,
    lastChecked: Date.now(),
    traffic,
    servers
  };

  const existingIndex = list.findIndex((s) => s.id === id || s.subUrl === cleanUrl);
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...newSub };
  } else {
    list.push(newSub);
  }

  saveVpnSubs(list);
  return { sub: newSub, allSubs: list };
}

/**
 * Remove a subscription by ID
 */
export function deleteVpnSub(id) {
  let list = getSavedVpnSubs().filter((s) => s.id !== id);
  saveVpnSubs(list);
  const activeId = getActiveSubId();
  if (activeId === id) {
    setActiveSubId(list.length > 0 ? list[0].id : null);
  }
  return list;
}

/**
 * Detect which subscription matches the current proxy IP / location
 */
export function detectActiveSub(subs, proxyIpData) {
  if (!subs || subs.length === 0) return null;
  if (subs.length === 1) return subs[0];

  const currentIp = String(proxyIpData?.query || proxyIpData?.ip || '').trim().toLowerCase();

  // 1. Manual IP bindings first
  if (currentIp) {
    const bindings = getIpBindings();
    const boundSubId = bindings[currentIp];
    if (boundSubId) {
      const bound = subs.find((s) => s.id === boundSubId);
      if (bound) return bound;
    }
  }

  // 2. Direct IP or server match in sub.servers list
  if (currentIp) {
    for (const sub of subs) {
      if (Array.isArray(sub.servers)) {
        for (const s of sub.servers) {
          if (s === currentIp) {
            return sub;
          }
        }
      }
    }
  }

  // 3. Sub URL domain match
  for (const sub of subs) {
    try {
      const parsed = new URL(sub.subUrl);
      const subHost = parsed.hostname.toLowerCase();
      if (currentIp && subHost === currentIp) {
        return sub;
      }
    } catch {}
  }

  // 4. Fallback: check saved active ID or return first sub
  const savedActiveId = getActiveSubId();
  if (savedActiveId) {
    const found = subs.find((s) => s.id === savedActiveId);
    if (found) return found;
  }

  return subs[0];
}
