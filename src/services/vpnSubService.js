/**
 * VPN Subscription & Happ Routing Service
 * Handles fetching traffic stats from v2ray/Xray/Hiddify/Happ subscription links
 * via Subscription-Userinfo header and response inspection.
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
 * Storage helpers
 */
export function getSavedVpnSub() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('homepage_vpn_sub_data');
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to get saved VPN sub:', e);
  }
  return {
    subUrl: '',
    title: '',
    lastChecked: null,
    traffic: null
  };
}

export function saveVpnSub(data) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('homepage_vpn_sub_data', JSON.stringify(data));
  }
}

export function clearVpnSub() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('homepage_vpn_sub_data');
  }
}

/**
 * Fetch VPN Subscription Traffic
 */
export async function fetchVpnSubTraffic(subUrl, title = '') {
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
    // Look for subscription-userinfo header (case-insensitive)
    for (const [k, v] of Object.entries(json.headers)) {
      if (k.toLowerCase() === 'subscription-userinfo') {
        userInfoHeader = v;
        break;
      }
    }
  }

  // Also check if JSON body has upload/download/total directly
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
    // If panel didn't provide standard header, create placeholder or basic response
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

  const savedData = {
    subUrl: cleanUrl,
    title: title.trim() || 'کانفیگ فیلترشکن HAPP',
    lastChecked: Date.now(),
    traffic
  };

  saveVpnSub(savedData);
  return savedData;
}
