import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  RefreshCw,
  HardDrive,
  Calendar,
  Clock,
  Trash2,
  Copy,
  Check,
  Route,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getSavedVpnSubs,
  fetchVpnSubTraffic,
  deleteVpnSub,
  getActiveSubId,
  setActiveSubId,
  detectActiveSub,
  HAPP_ROUTING_URL
} from '../services/vpnSubService';

export default function VpnSubModal({ isOpen, onClose, onUpdated, onOpenRoutingModal, proxyIpData }) {
  const [subs, setSubs] = useState([]);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [subUrl, setSubUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedRouting, setCopiedRouting] = useState(false);

  function reloadAll() {
    const list = getSavedVpnSubs();
    setSubs(list);
    const active = detectActiveSub(list, proxyIpData);
    if (active) {
      setSelectedSubId(active.id);
    } else if (list.length > 0) {
      setSelectedSubId(list[0].id);
    }
  }

  useEffect(() => {
    if (isOpen) {
      reloadAll();
      setError('');
      setSuccess('');
      setIsAddingNew(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentProxyIp = proxyIpData?.query || proxyIpData?.ip || '';
  const detectedSub = detectActiveSub(subs, proxyIpData);
  const selectedSub = subs.find((s) => s.id === selectedSubId) || detectedSub || subs[0];

  async function handleFetch(e) {
    if (e) e.preventDefault();
    if (!subUrl.trim()) {
      setError('لطفاً آدرس لینک ساب را وارد نمایید.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await fetchVpnSubTraffic(subUrl, title);
      setSubs(result.allSubs);
      setSelectedSubId(result.sub.id);
      setActiveSubId(result.sub.id);
      setSubUrl('');
      setTitle('');
      setIsAddingNew(false);
      setSuccess(`اطلاعات اشتراک با موفقیت ثبت شد (${result.sub.servers.length} سرور شناسایی گردید).`);
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات از لینک ساب.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefreshSingle(sub) {
    if (!sub?.subUrl) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await fetchVpnSubTraffic(sub.subUrl, sub.title, sub.id);
      setSubs(result.allSubs);
      setSuccess('ترافیک این اشتراک بروزرسانی شد.');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'خطا در بروزرسانی ترافیک.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete(id) {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این لینک ساب را حذف کنید؟')) {
      const updated = deleteVpnSub(id);
      setSubs(updated);
      if (selectedSubId === id) {
        setSelectedSubId(updated.length > 0 ? updated[0].id : null);
      }
      setSuccess('اشتراک حذف گردید.');
      if (onUpdated) onUpdated();
    }
  }

  function handleSetManualActive(id) {
    setActiveSubId(id);
    setSelectedSubId(id);
    if (onUpdated) onUpdated();
  }

  function handleCopyRouting() {
    navigator.clipboard?.writeText(HAPP_ROUTING_URL);
    setCopiedRouting(true);
    setTimeout(() => setCopiedRouting(false), 2000);
  }

  const traffic = selectedSub?.traffic;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-xl p-6 shadow-2xl text-white relative max-h-[88vh] overflow-y-auto scrollbar-thin animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                مدیریت اشتراک‌های فیلترشکن (چند ساب)
              </h2>
              <p className="text-xs text-gray-400">
                تشخیص هوشمند کانفیگ فعال از روی IP پروکسی و نمایش حجم باقی‌مانده
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Proxy IP & Detection Banner */}
        <div className="p-3 rounded-xl bg-slate-800/80 border border-white/10 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-gray-300">آی‌پی متصل فعلی:</span>
            <span className="font-mono font-bold text-sky-300" dir="ltr">
              {currentProxyIp || 'در حال استعلام...'}
            </span>
          </div>

          {detectedSub && (
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>متصل به: {detectedSub.title}</span>
            </span>
          )}
        </div>

        {/* Success or Error banners */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs of Subscriptions (Multi-Sub Selector) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>اشتراک‌های ثبت‌شده ({subs.length}):</span>
            </span>
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition"
            >
              <Plus className="w-3 h-3" />
              <span>افزودن ساب جدید</span>
            </button>
          </div>

          {subs.length === 0 ? (
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-center text-xs text-gray-400">
              هنوز هیچ لینک سابی اضافه نشده است. روی «افزودن ساب جدید» کلیک کنید.
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {subs.map((s) => {
                const isSelected = selectedSub?.id === s.id;
                const isDetected = detectedSub?.id === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubId(s.id);
                      setIsAddingNew(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-bold'
                        : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <span>{s.title}</span>
                    {isDetected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/40" title="اتصال فعلی" />
                    )}
                    {s.traffic?.remainingText && (
                      <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-black/20 text-slate-950' : 'bg-black/40 text-emerald-300'}`}>
                        {s.traffic.remainingText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Sub Traffic & Details Card */}
        {selectedSub && !isAddingNew && (
          <div className="mb-5 p-4 rounded-xl bg-black/40 border border-white/15 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">
                  {selectedSub.title}
                </span>
                {detectedSub?.id === selectedSub.id ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                    ✓ فعال در این اتصال
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetManualActive(selectedSub.id)}
                    className="text-[10px] text-gray-400 hover:text-cyan-300 underline"
                  >
                    انتخاب به عنوان پیش‌فرض
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRefreshSingle(selectedSub)}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                  title="بروزرسانی ترافیک این ساب"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => handleDelete(selectedSub.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                  title="حذف این ساب"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Volume Stats */}
            {traffic && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center py-1">
                  <div className="bg-white/5 p-2 rounded-lg">
                    <span className="text-[10px] text-gray-400 block mb-0.5">باقی‌مانده:</span>
                    <span className="text-sm sm:text-base font-black text-emerald-400">
                      {traffic.remainingText}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <span className="text-[10px] text-gray-400 block mb-0.5">مصرف‌شده:</span>
                    <span className="text-sm sm:text-base font-bold text-cyan-300">
                      {traffic.usedText}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <span className="text-[10px] text-gray-400 block mb-0.5">کل بسته:</span>
                    <span className="text-sm sm:text-base font-bold text-gray-200">
                      {traffic.totalText}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {traffic.total > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>مصرف شده: {traffic.percentUsed}٪</span>
                      <span>باقی‌مانده: {traffic.percentRemaining}٪</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          traffic.percentUsed > 85
                            ? 'bg-rose-500'
                            : traffic.percentUsed > 60
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${traffic.percentUsed}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expiration and Servers count */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-gray-300 border-t border-white/5 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>انقضا: </span>
                    <span className="font-semibold text-white">{traffic.expireFormatted}</span>
                    {traffic.daysLeft !== null && (
                      <span className="text-[11px] text-cyan-300">
                        ({traffic.daysLeft > 0 ? `${traffic.daysLeft} روز باقی‌مانده` : 'منقضی'})
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-gray-400 font-mono">
                    {selectedSub.servers?.length || 0} آدرس سرور ثبت‌شده
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add New Subscription Form (shown when clicking Add New or when list empty) */}
        {(isAddingNew || subs.length === 0) && (
          <form onSubmit={handleFetch} className="mb-5 p-4 rounded-xl bg-black/40 border border-cyan-500/30 space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>افزودن لینک ساب جدید:</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                عنوان اشتراک (مثال: ساب همراه اول / ایرانسل / آلمان):
              </label>
              <input
                type="text"
                placeholder="مثلاً: سرور VIP ۱"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                آدرس لینک ساب (Subscription URL): <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="https://.../api/v1/client/subscribe?token=... یا لینک V2ray/Hiddify"
                value={subUrl}
                onChange={(e) => setSubUrl(e.target.value)}
                required
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition font-mono break-all"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {subs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
                >
                  انصراف
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl transition shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'در حال دریافت...' : 'استعلام و افزودن ساب'}
              </button>
            </div>
          </form>
        )}

        {/* Happ Routing Quick Bar inside Modal */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <Route className="w-4 h-4" />
              <span>پروفایل روتینگ اپلیکیشن HAPP</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenRoutingModal) onOpenRoutingModal();
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              آموزش افزودن روتینگ
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRouting}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition"
            >
              {copiedRouting ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRouting ? 'لینک روتینگ کپی شد' : 'کپی لینک روتینگ HAPP'}</span>
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = HAPP_ROUTING_URL)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
              title="باز کردن مستقیم در برنامه Happ"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
