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

  async function fetchIranIp() {
    setIp1({ loading: true, data: null, error: false });
    try {
      const data = await fetchJSONP('https://api.ipmyp.ir/json');
      if (data && (data.query || data.ip)) {
        setIp1({ loading: false, data, error: false });
      } else {
        setIp1({ loading: false, data: null, error: true });
      }
    } catch {
      try {
        const res = await fetch('https://telbot.hekmateislami.com/fext/ip.php');
        const data = await res.json();
        if (data && (data.query || data.ip)) {
          setIp1({ loading: false, data, error: false });
          return;
        }
      } catch {}
      setIp1({ loading: false, data: null, error: true });
    }
  }

  async function fetchForeignIp() {
    setIp2({ loading: true, data: null, error: false });
    try {
      let data = null;
      try {
        const res = await fetch('https://api.ip.sb/geoip');
        if (res.ok) data = await res.json();
      } catch {
        const fallback = await fetch('https://ipwho.is/');
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

  const ip1Val = ip1.data?.query || ip1.data?.ip;
  const ip1CountryCode = ip1.data?.countryCode || ip1.data?.country_code || 'IR';
  const ip1Flag = getCountryFlag(ip1CountryCode);

  const ip2Val = ip2.data?.ip || ip2.data?.query;
  const ip2CountryCode = ip2.data?.country_code || ip2.data?.countryCode || '';
  const ip2Flag = getCountryFlag(ip2CountryCode);

  return (
    <div className="glass rounded-2xl p-5 border border-white/20">
      <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <i className="fas fa-network-wired text-cyan-400"></i>
          <span>اطلاعات IP شما</span>
        </h2>
        <button
          onClick={fetchAll}
          disabled={ip1.loading || ip2.loading}
          className="text-gray-400 hover:text-white p-1 rounded transition disabled:opacity-50"
          title="بروزرسانی"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${(ip1.loading || ip2.loading) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Widget 1: Iranian */}
      <div className="mb-4 bg-black/30 p-3 rounded-lg text-sm" id="ip-widget-1">
        <p className="text-gray-400 mb-1">سرویس اول (ایرانی):</p>
        {ip1.loading ? (
          <p className="text-gray-300 animate-pulse">در حال دریافت اطلاعات...</p>
        ) : ip1.error ? (
          <p className="text-red-400">عدم دسترسی به سرویس ایرانی</p>
        ) : (
          <div>
            <p className="text-green-400 font-bold font-mono flex items-center gap-2" dir="ltr">
              <span className="text-base select-none" title={ip1.data?.country || 'Iran'}>{ip1Flag}</span>
              <span>IP: {ip1Val}</span>
            </p>
            <p>کشور: {ip1.data?.country || 'ایران'} ({ip1CountryCode})</p>
            <p>شهر: {ip1.data?.city || '-'} - منطقه: {ip1.data?.regionName || ip1.data?.region || '-'}</p>
            <p>ISP: {ip1.data?.isp || ip1.data?.org || '-'}</p>
          </div>
        )}
      </div>

      {/* Widget 2: Foreign */}
      <div className="bg-black/30 p-3 rounded-lg text-sm" id="ip-widget-2">
        <p className="text-gray-400 mb-1">سرویس دوم (خارجی):</p>
        {ip2.loading ? (
          <p className="text-gray-300 animate-pulse">در حال دریافت اطلاعات...</p>
        ) : ip2.error ? (
          <p className="text-red-400">عدم دسترسی به سرویس خارجی</p>
        ) : (
          <div>
            <p className="text-blue-400 font-bold font-mono flex items-center gap-2" dir="ltr">
              <span className="text-base select-none" title={ip2.data?.country || ip2.data?.country_name || ''}>{ip2Flag}</span>
              <span>IP: {ip2Val}</span>
            </p>
            <p>کشور: {ip2.data?.country || ip2.data?.country_name || '-'} ({ip2CountryCode || '-'})</p>
            <p>شهر: {ip2.data?.city || '-'} - منطقه: {ip2.data?.region || ip2.data?.regionName || '-'}</p>
            <p>ISP: {ip2.data?.isp || ip2.data?.organization || '-'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
