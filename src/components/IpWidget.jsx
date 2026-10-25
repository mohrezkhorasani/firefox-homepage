import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

function fetchJSONP(url, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const callbackName = 'ipmyp_cb_' + Math.floor(Math.random() * 1000000);
    const script = document.createElement('script');
    let timer = null;

    window[callbackName] = function (data) {
      cleanup();
      resolve(data);
    };

    function cleanup() {
      if (timer) clearTimeout(timer);
      delete window[callbackName];
      if (script.parentNode) script.remove();
    }

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP Timeout'));
    }, timeout);

    script.onerror = function () {
      cleanup();
      reject(new Error('JSONP Script Error'));
    };

    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}callback=${callbackName}`;
    document.head.appendChild(script);
  });
}

// Convert 2-letter country code (like 'IR', 'DE', 'US') to emoji flag
function getCountryFlag(countryCode) {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
    return '🌐';
  }
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(
    127397 + code.charCodeAt(0),
    127397 + code.charCodeAt(1)
  );
}

// Format: [logo] 5.10.248.107 Iran (IR) - Tehran - منطقه - ISP
function formatIpDetails(data, defaultCountry = '') {
  if (!data) return null;
  const ip = data.query || data.ip || '-';
  const country = data.country || data.country_name || defaultCountry || '-';
  const code = (data.countryCode || data.country_code || (defaultCountry === 'Iran' ? 'IR' : '')).toUpperCase();
  const city = data.city || '';
  const region = data.regionName || data.region || '';
  const isp = data.isp || data.org || data.organization || data.connection?.isp || '';

  const parts = [];
  if (country && code) {
    parts.push(`${country} (${code})`);
  } else if (country) {
    parts.push(country);
  }

  if (city && city !== '-' && city !== 'null') {
    parts.push(city);
  }

  if (region && region !== '-' && region !== 'null' && region !== city) {
    parts.push(region);
  }

  if (isp && isp !== '-' && isp !== 'null') {
    parts.push(isp);
  }

  return {
    ip,
    flag: getCountryFlag(code),
    text: parts.join(' - ')
  };
}

export default function IpWidget() {
  const [ip1, setIp1] = useState({ loading: true, data: null, error: false });
  const [ip2, setIp2] = useState({ loading: true, data: null, error: false });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    fetchIranIp();
    fetchForeignIp();
  }

  // Service 1: Network / Iran IP (with domestic fallbacks)
  async function fetchIranIp() {
    setIp1({ loading: true, data: null, error: false });
    
    // Primary: ipmyp.ir (domestic Iran service)
    try {
      const data = await fetchJSONP('https://api.ipmyp.ir/json');
      if (data && (data.query || data.ip)) {
        setIp1({ loading: false, data, error: false });
        return;
      }
    } catch {}

    // Fallback 1: ipwho.is (direct network lookup with full details)
    try {
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && (data.ip || data.query)) {
          setIp1({
            loading: false,
            data: {
              query: data.ip,
              country: data.country,
              countryCode: data.country_code,
              city: data.city,
              regionName: data.region,
              isp: data.connection?.isp || data.isp
            },
            error: false
          });
          return;
        }
      }
    } catch {}

    // Fallback 2: api.ip.sb/geoip
    try {
      const res = await fetch('https://api.ip.sb/geoip');
      if (res.ok) {
        const data = await res.json();
        if (data && (data.ip || data.query)) {
          setIp1({ loading: false, data, error: false });
          return;
        }
      }
    } catch {}

    setIp1({ loading: false, data: null, error: true });
  }

  // Service 2: Foreign / Proxy IP
  async function fetchForeignIp() {
    setIp2({ loading: true, data: null, error: false });
    try {
      let data = null;
      try {
        const res = await fetch('https://api.ip.sb/geoip');
        if (res.ok) data = await res.json();
      } catch {
        const fallback = await fetch('https://ipwhois.app/json/');
        if (fallback.ok) data = await fallback.json();
      }

      if (data && (data.ip || data.query)) {
        setIp2({ loading: false, data, error: false });
      } else {
        setIp2({ loading: false, data: null, error: true });
      }
    } catch {
      setIp2({ loading: false, data: null, error: true });
    }
  }

  const info1 = formatIpDetails(ip1.data, 'Iran');
  const info2 = formatIpDetails(ip2.data, '');

  return (
    <div className="bg-black/40 rounded-xl p-2 border border-white/10 text-xs shadow-inner">
      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-white/10">
        <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5" dir="rtl">
          <i className="fas fa-network-wired text-[10px]"></i>
          <span>آی‌پی شبکه</span>
        </span>
        <button
          onClick={fetchAll}
          disabled={ip1.loading || ip2.loading}
          className="text-gray-400 hover:text-white p-0.5 rounded transition disabled:opacity-50"
          title="بروزرسانی آی‌پی‌ها"
        >
          <RefreshCw className={`w-3 h-3 ${(ip1.loading || ip2.loading) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-1.5 font-mono text-[10.5px]" dir="ltr">
        {/* Service 1 (Network / Iran) */}
        <div 
          className="overflow-hidden" 
          title={info1 ? `${info1.ip} - ${info1.text}` : 'سرویس اول'}
        >
          {ip1.loading ? (
            <span className="text-gray-400 animate-pulse text-[10px] font-sans">در حال بررسی شبکه...</span>
          ) : ip1.error ? (
            <span className="text-red-400 text-[10px] font-sans">خطای سرویس شبکه</span>
          ) : (
            <>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs select-none shrink-0">{info1?.flag || '🌐'}</span>
                <span className="font-bold text-emerald-400 truncate">{info1?.ip}</span>
              </div>
              <div className="text-[9px] text-gray-300 truncate mt-0.5" title={info1?.text}>
                {info1?.text}
              </div>
            </>
          )}
        </div>

        {/* Service 2 (Foreign / Proxy) */}
        <div 
          className="overflow-hidden pt-1 border-t border-white/10" 
          title={info2 ? `${info2.ip} - ${info2.text}` : 'سرویس دوم'}
        >
          {ip2.loading ? (
            <span className="text-gray-400 animate-pulse text-[10px] font-sans">در حال بررسی خارجی...</span>
          ) : ip2.error ? (
            <span className="text-red-400 text-[10px] font-sans">خطای سرویس خارجی</span>
          ) : (
            <>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs select-none shrink-0">{info2?.flag || '🌐'}</span>
                <span className="font-bold text-sky-400 truncate">{info2?.ip}</span>
              </div>
              <div className="text-[9px] text-gray-300 truncate mt-0.5" title={info2?.text}>
                {info2?.text}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
