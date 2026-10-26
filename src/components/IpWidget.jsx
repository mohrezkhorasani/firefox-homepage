import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, Radio, Route, HelpCircle, HardDrive, Calendar, ExternalLink, Zap } from 'lucide-react';
import { getSavedVpnSubs, detectActiveSub, HAPP_ROUTING_URL } from '../services/vpnSubService';
import VpnSubModal from './VpnSubModal';
import HappRoutingModal from './HappRoutingModal';

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
    country,
    code,
    city,
    region,
    isp,
    flag: getCountryFlag(code),
    text: parts.join(' - ')
  };
}

export default function IpWidget() {
  const [ip1, setIp1] = useState({ loading: true, data: null, error: false });
  const [ip2, setIp2] = useState({ loading: true, data: null, error: false });
  const [hoveredIp, setHoveredIp] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedRouting, setCopiedRouting] = useState(false);

  // Multi-subscription state
  const [vpnSubs, setVpnSubs] = useState([]);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  function reloadVpnSubs() {
    setVpnSubs(getSavedVpnSubs());
  }

  async function fetchAll() {
    fetchIranIp();
    fetchForeignIp();
    reloadVpnSubs();
  }

  function handleCopy(text) {
    if (!text || text === '-') return;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleCopyRouting(e) {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(HAPP_ROUTING_URL);
    setCopiedRouting(true);
    setTimeout(() => setCopiedRouting(false), 2000);
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

  // Detect active subscription automatically based on IP 2
  const activeSub = detectActiveSub(vpnSubs, ip2.data);
  const traffic = activeSub?.traffic;
  const hasSubs = vpnSubs.length > 0;

  return (
    <div className="relative bg-black/40 rounded-xl p-2 border border-white/10 text-xs shadow-inner w-full">
      {/* Floating Sticky Tooltip Card */}
      {hoveredIp && (
        <div 
          className="absolute bottom-full left-0 mb-3 w-[305px] z-50 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3 shadow-2xl shadow-black text-white pointer-events-auto transition-all animate-fade-in"
          onMouseEnter={() => setHoveredIp(hoveredIp)}
          onMouseLeave={() => setHoveredIp(null)}
        >
          {/* Triangle Pointer Arrow */}
          <div 
            className={`absolute -bottom-1.5 ${hoveredIp === 1 ? 'left-6' : 'left-8'} w-3 h-3 bg-slate-900 border-b border-r border-cyan-500/40 transform rotate-45`}
          />

          {hoveredIp === 1 ? (
            <div className="space-y-2">
              {/* Header Title */}
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5" dir="rtl">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>آی پی اصلی شما (ایران)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(info1?.ip)}
                  className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/10 transition"
                >
                  {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>

              {/* Complete Address & Location under title */}
              <div className="bg-black/50 p-2 rounded-xl border border-white/5 font-mono text-[11px] space-y-1" dir="ltr">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <span className="text-sm">{info1?.flag || '🌐'}</span>
                  <span>{info1?.ip || '-'}</span>
                </div>
                <div className="text-gray-200 text-[10px] leading-relaxed break-words">
                  {info1?.text || 'اطلاعات در دسترس نیست'}
                </div>
              </div>

              {/* Breakdown Details */}
              <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-300" dir="rtl">
                <div className="bg-white/5 px-2 py-1 rounded-lg">
                  <span className="text-gray-400">کشور: </span>
                  <span className="font-semibold text-white">{info1?.country || '-'} ({info1?.code || '-'})</span>
                </div>
                <div className="bg-white/5 px-2 py-1 rounded-lg truncate">
                  <span className="text-gray-400">شهر/منطقه: </span>
                  <span className="font-semibold text-white">{info1?.city || info1?.region || '-'}</span>
                </div>
                <div className="bg-white/5 px-2 py-1 rounded-lg col-span-2 truncate">
                  <span className="text-gray-400">ارائه‌دهنده: </span>
                  <span className="font-semibold text-cyan-300">{info1?.isp || '-'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Header Title */}
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5" dir="rtl">
                <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>آی پی روت پروفایل HAPP</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(info2?.ip)}
                  className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 border border-white/10 transition"
                >
                  {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>

              {/* Complete Address & Location under title */}
              <div className="bg-black/50 p-2 rounded-xl border border-white/5 font-mono text-[11px] space-y-1" dir="ltr">
                <div className="text-sky-400 font-bold flex items-center gap-1.5 text-xs">
                  <span className="text-sm">{info2?.flag || '🌐'}</span>
                  <span>{info2?.ip || '-'}</span>
                </div>
                <div className="text-gray-200 text-[10px] leading-relaxed break-words">
                  {info2?.text || 'اطلاعات در دسترس نیست'}
                </div>
              </div>

              {/* Breakdown Details */}
              <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-300" dir="rtl">
                <div className="bg-white/5 px-2 py-1 rounded-lg">
                  <span className="text-gray-400">کشور: </span>
                  <span className="font-semibold text-white">{info2?.country || '-'} ({info2?.code || '-'})</span>
                </div>
                <div className="bg-white/5 px-2 py-1 rounded-lg truncate">
                  <span className="text-gray-400">شهر/منطقه: </span>
                  <span className="font-semibold text-white">{info2?.city || info2?.region || '-'}</span>
                </div>
                <div className="bg-white/5 px-2 py-1 rounded-lg col-span-2 truncate">
                  <span className="text-gray-400">ارائه‌دهنده: </span>
                  <span className="font-semibold text-sky-300">{info2?.isp || '-'}</span>
                </div>
              </div>

              {/* VPN Subscription Traffic Info Section */}
              <div className="bg-sky-950/40 p-2.5 rounded-xl border border-sky-500/25 space-y-1.5 text-xs" dir="rtl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-sky-300 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ترافیک اشتراک فعال</span>
                  </span>
                  <button
                    onClick={() => {
                      setHoveredIp(null);
                      setIsSubModalOpen(true);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    {hasSubs ? `مدیریت ساب‌ها (${vpnSubs.length})` : 'افزودن لینک ساب'}
                  </button>
                </div>

                {activeSub && traffic ? (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-300 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>{activeSub.title}:</span>
                      </span>
                      <span className="font-black text-emerald-400">{traffic.remainingText}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>مصرف شده: {traffic.usedText}</span>
                      <span>کل بسته: {traffic.totalText}</span>
                    </div>

                    {traffic.total > 0 && (
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            traffic.percentUsed > 85
                              ? 'bg-rose-500'
                              : traffic.percentUsed > 60
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${traffic.percentUsed}%` }}
                        />
                      </div>
                    )}

                    {traffic.daysLeft !== null && (
                      <div className="text-[10px] text-amber-300 flex items-center justify-between pt-0.5">
                        <span>انقضا: {traffic.expireFormatted}</span>
                        <span>({traffic.daysLeft > 0 ? `${traffic.daysLeft} روز باقی‌مانده` : 'منقضی'})</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10.5px] text-gray-400 pt-0.5">
                    هنوز لینک سابی اضافه نشده است. برای ثبت چند ساب و تشخیص خودکار کلیک کنید.
                  </p>
                )}
              </div>

              {/* HAPP Routing Profile Quick Buttons */}
              <div className="pt-1 flex items-center gap-1.5" dir="rtl">
                <button
                  type="button"
                  onClick={handleCopyRouting}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10.5px] font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition"
                  title="کپی لینک روتینگ HAPP"
                >
                  {copiedRouting ? <Check className="w-3 h-3 text-emerald-400" /> : <Route className="w-3 h-3" />}
                  <span>{copiedRouting ? 'کپی شد!' : 'کپی روتینگ HAPP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHoveredIp(null);
                    setIsRoutingModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10.5px] font-medium bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 transition"
                  title="آموزش افزودن روتینگ"
                >
                  <HelpCircle className="w-3 h-3 text-cyan-400" />
                  <span>آموزش</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Title bar */}
      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-white/10">
        <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5" dir="rtl">
          <i className="fas fa-network-wired text-[10px]"></i>
          <span>آی‌پی شبکه</span>
        </span>
        <button
          onClick={fetchAll}
          disabled={ip1.loading || ip2.loading}
          className="text-gray-400 hover:text-white p-0.5 rounded transition disabled:opacity-50"
          title="بروزرسانی آی‌پی‌ها و ساب‌ها"
        >
          <RefreshCw className={`w-3 h-3 ${(ip1.loading || ip2.loading) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-1.5 font-mono text-[10.5px]" dir="ltr">
        {/* Service 1 (Network / Iran) */}
        <div 
          className="overflow-hidden cursor-pointer rounded-md hover:bg-white/5 p-0.5 transition" 
          onMouseEnter={() => setHoveredIp(1)}
          onMouseLeave={() => setHoveredIp(null)}
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
              <div className="text-[9px] text-gray-300 truncate mt-0.5">
                {info1?.text}
              </div>
            </>
          )}
        </div>

        {/* Service 2 (Foreign / Proxy / HAPP) */}
        <div 
          className="overflow-hidden pt-1 border-t border-white/10 cursor-pointer rounded-md hover:bg-white/5 p-0.5 transition" 
          onMouseEnter={() => setHoveredIp(2)}
          onMouseLeave={() => setHoveredIp(null)}
        >
          {ip2.loading ? (
            <span className="text-gray-400 animate-pulse text-[10px] font-sans">در حال بررسی خارجی...</span>
          ) : ip2.error ? (
            <span className="text-red-400 text-[10px] font-sans">خطای سرویس خارجی</span>
          ) : (
            <>
              <div className="flex items-center justify-between leading-none">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs select-none shrink-0">{info2?.flag || '🌐'}</span>
                  <span className="font-bold text-sky-400 truncate">{info2?.ip}</span>
                </div>

                {/* Sub & Routing Quick Action Icons */}
                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setIsSubModalOpen(true)}
                    className="text-gray-400 hover:text-cyan-300 p-0.5 rounded transition"
                    title={traffic?.remainingText ? `${activeSub?.title || 'ساب'}: ${traffic.remainingText}` : 'مدیریت چند ساب فیلترشکن'}
                  >
                    <Radio className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyRouting}
                    className="text-gray-400 hover:text-sky-300 p-0.5 rounded transition"
                    title="کپی روتینگ HAPP"
                  >
                    {copiedRouting ? <Check className="w-3 h-3 text-emerald-400" /> : <Route className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRoutingModalOpen(true)}
                    className="text-gray-400 hover:text-white p-0.5 rounded transition"
                    title="آموزش روتینگ HAPP"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="text-[9px] text-gray-300 truncate mt-0.5">
                {info2?.text}
              </div>

              {/* Mini traffic pill under IP 2 for the detected active sub */}
              {hasSubs && activeSub && traffic && (
                <div className="mt-1 pt-1 border-t border-white/5 font-sans" dir="rtl">
                  <div className="flex items-center justify-between text-[9px] leading-tight">
                    <span className="text-emerald-400 font-bold truncate flex items-center gap-1">
                      <span className="text-[8px] bg-sky-500/30 text-sky-300 px-1 rounded truncate max-w-[70px]">
                        {activeSub.title}
                      </span>
                      <span>{traffic.remainingText}</span>
                    </span>
                    {traffic.daysLeft !== null && (
                      <span className="text-[8.5px] text-gray-400 truncate">
                        {traffic.daysLeft > 0 ? `${traffic.daysLeft} روز` : 'منقضی'}
                      </span>
                    )}
                  </div>
                  {traffic.total > 0 && (
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={`h-full rounded-full ${
                          traffic.percentUsed > 85
                            ? 'bg-rose-500'
                            : traffic.percentUsed > 60
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${traffic.percentUsed}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* VPN Subscription Modal */}
      <VpnSubModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        onUpdated={reloadVpnSubs}
        onOpenRoutingModal={() => setIsRoutingModalOpen(true)}
        proxyIpData={ip2.data}
      />

      {/* Happ Routing Tutorial Modal */}
      <HappRoutingModal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
      />
    </div>
  );
}
