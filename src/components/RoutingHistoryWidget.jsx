import React, { useState, useEffect } from 'react';
import { 
  Network, Globe, Shield, RefreshCw, Trash2, Search, ArrowRight, 
  ExternalLink, Check, AlertCircle, Zap, Cpu, Server, Filter, Sparkles
} from 'lucide-react';

const ROUTING_SERVICE_URL = 'http://127.0.0.1:23159';

export default function RoutingHistoryWidget() {
  const [routes, setRoutes] = useState([]);
  const [directIp, setDirectIp] = useState('2.179.167.151');
  const [proxyIp, setProxyIp] = useState('159.65.32.214');
  const [activeProfile, setActiveProfile] = useState('Default');
  const [routingOrder, setRoutingOrder] = useState('block-direct-proxy');
  const [globalProxy, setGlobalProxy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isServiceOnline, setIsServiceOnline] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'direct', 'proxy'
  const [testDomainInput, setTestDomainInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function fetchRoutes() {
    try {
      const res = await fetch(`${ROUTING_SERVICE_URL}/api/routes`, {
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
        if (data.direct_ip) setDirectIp(data.direct_ip);
        if (data.proxy_ip) setProxyIp(data.proxy_ip);
        if (data.active_profile) setActiveProfile(data.active_profile);
        if (data.routing_order) setRoutingOrder(data.routing_order);
        if (typeof data.global_proxy === 'boolean') setGlobalProxy(data.global_proxy);
        setIsServiceOnline(true);
      } else {
        setIsServiceOnline(false);
      }
    } catch (err) {
      setIsServiceOnline(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Initial fetch and auto-refresh every 4 seconds
  useEffect(() => {
    fetchRoutes();
    const interval = setInterval(fetchRoutes, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleClearHistory() {
    if (!window.confirm('آیا از پاک‌سازی کل تاریخچه روتینگ مطمئن هستید؟')) return;
    try {
      const res = await fetch(`${ROUTING_SERVICE_URL}/api/routes/clear`, {
        method: 'POST',
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        setRoutes([]);
        showToast('تاریخچه روت‌ها با موفقیت پاک شد.');
      }
    } catch (err) {
      showToast('خطا در ارتباط با سرویس پایتون');
    }
  }

  async function handleTestDomain(e) {
    e.preventDefault();
    const domain = testDomainInput.trim();
    if (!domain) return;
    setIsTesting(true);

    try {
      const res = await fetch(`${ROUTING_SERVICE_URL}/api/inspect?hostname=${encodeURIComponent(domain)}`, {
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        setTestDomainInput('');
        await fetchRoutes();
        showToast(`دامنه «${domain}» بررسی شد: مسیر ${data.route === 'direct' ? 'مستقیم (ایران)' : 'فیلترشکن (VPN)'}`);
      }
    } catch (err) {
      showToast('خطا در تست مسیر دامنه');
    } finally {
      setIsTesting(false);
    }
  }

  const filteredRoutes = routes.filter((r) => {
    if (filterType === 'direct' && !r.is_direct) return false;
    if (filterType === 'proxy' && r.is_direct) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchHost = (r.hostname || '').toLowerCase().includes(q);
      const matchClientIp = (r.client_ip || '').includes(q);
      const matchSiteIp = (r.site_ip || '').includes(q);
      const matchRule = (r.rule_matched || '').toLowerCase().includes(q);
      return matchHost || matchClientIp || matchSiteIp || matchRule;
    }
    return true;
  });

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-5 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-cyan-900/30">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>تاریخچه و پایش روتینگ ترافیک (Traffic Route History)</span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
                isServiceOnline 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isServiceOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                <span>{isServiceOnline ? 'پورت 23159 آنلاین' : 'سرویس آفلاین'}</span>
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              پایش لحظه‌ای مسیر عبور ترافیک هر سایت بر اساس روتینگ Happ (مستقیم با آی‌پی ایران یا عبور از فیلترشکن)
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={fetchRoutes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition text-xs font-semibold"
            title="بروزرسانی داده‌ها"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>بروزرسانی</span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={routes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition text-xs font-semibold disabled:opacity-40"
            title="پاک‌سازی تاریخچه"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>پاکسازی</span>
          </button>
        </div>
      </div>

      {/* Top Status & IP Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Direct IP (Iran) */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                آی‌پی مستقیم ایران (Direct IP)
              </span>
              <span className="font-mono text-sm font-bold text-white" dir="ltr">
                {directIp}
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Proxy IP (VPN) */}
        <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-purple-400 font-bold block uppercase tracking-wider">
                آی‌پی فیلترشکن (VPN Exit IP)
              </span>
              <span className="font-mono text-sm font-bold text-white" dir="ltr">
                {proxyIp}
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-purple-400" />
        </div>

        {/* Happ Routing Profile Info */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold block uppercase tracking-wider">
                پروفایل روتینگ Happ
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span>{activeProfile}</span>
                <span className="text-[10px] font-mono text-cyan-300 font-normal">({routingOrder})</span>
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
            {globalProxy ? 'Global Proxy' : 'Rule-Based'}
          </span>
        </div>
      </div>

      {/* Manual Domain Test Bar */}
      <form onSubmit={handleTestDomain} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            dir="ltr"
            placeholder="بررسی مسیر دامنه دلخواه (مثلاً: youtube.com یا divar.ir یا gemini.google.com)..."
            value={testDomainInput}
            onChange={(e) => setTestDomainInput(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-mono transition"
          />
        </div>
        <button
          type="submit"
          disabled={isTesting || !testDomainInput.trim()}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30 disabled:opacity-50 shrink-0"
        >
          {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>تست مسیر</span>
        </button>
      </form>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در دامنه، آی‌پی، قانون..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 w-full sm:w-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              filterType === 'all'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            همه ({routes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('direct')}
            className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filterType === 'direct'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>مستقیم ({routes.filter(r => r.is_direct).length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('proxy')}
            className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              filterType === 'proxy'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>فیلترشکن ({routes.filter(r => !r.is_direct).length})</span>
          </button>
        </div>
      </div>

      {/* Routes List */}
      <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
        {filteredRoutes.length === 0 ? (
          <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center">
            <Network className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-xs">
              {searchQuery ? 'هیچ موردی مطابق با جستجوی شما یافت نشد.' : 'هنوز روتینگی ثبت نشده است. با باز کردن هر تب جدید در مرورگر، مسیر آن در اینجا ثبت می‌شود.'}
            </p>
          </div>
        ) : (
          filteredRoutes.map((r, i) => {
            const isDirect = r.is_direct;
            return (
              <div
                key={r.id || i}
                className={`p-3 rounded-2xl glass-subtle border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isDirect
                    ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/10'
                    : 'border-purple-500/20 hover:border-purple-500/40 bg-purple-950/10'
                }`}
              >
                {/* Hostname & Rule Matched */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDirect
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  }`}>
                    {isDirect ? <Globe className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white truncate" dir="ltr">
                        {r.hostname}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border shrink-0 ${
                        isDirect
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isDirect ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
                        <span>{isDirect ? 'مستقیم (ایران)' : 'فیلترشکن (VPN)'}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {r.rule_matched || (isDirect ? 'مسیر مستقیم' : 'مسیر فیلترشکن')}
                    </p>
                  </div>
                </div>

                {/* IPs and Timestamp */}
                <div className="flex items-center gap-4 text-xs shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
                  {/* Client IP */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">آی‌پی دیده شده:</span>
                    <span className={`font-mono text-xs font-bold ${isDirect ? 'text-emerald-300' : 'text-purple-300'}`} dir="ltr">
                      {r.client_ip || '...'}
                    </span>
                  </div>

                  {/* Site IP */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">آی‌پی هاست سایت:</span>
                    <span className="font-mono text-xs text-slate-300 font-semibold" dir="ltr">
                      {r.site_ip || '...'}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="text-left font-mono text-[11px] text-slate-400 shrink-0">
                    <span>{r.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <span>تعداد کل مسیرهای ثبت‌شده: {routes.length} روت</span>
        <span className="text-[11px] text-slate-400">
          هماهنگ با افزونه Dual IP Inspector و هسته پروکسی Happ در پورت 23159
        </span>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900/95 border border-cyan-500/40 text-cyan-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-medium backdrop-blur-md animate-fade-in flex items-center gap-2 max-w-md">
          <Network className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
