import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Link,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  getSavedVpnSubs,
  fetchVpnSubTraffic,
  deleteVpnSub,
  getActiveSubId,
  setActiveSubId,
  detectActiveSub,
  bindIpToSub,
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
  const currentCountry = proxyIpData?.country || proxyIpData?.country_name || '';
  const currentIsp = proxyIpData?.isp || proxyIpData?.org || '';

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

      // Auto-bind current proxy IP to this newly added sub if user has proxy active
      if (currentProxyIp) {
        bindIpToSub(currentProxyIp, result.sub.id);
      }

      setSubUrl('');
      setTitle('');
      setIsAddingNew(false);
      setSuccess(`اشتراک جدید با موفقیت اضافه و به این کانفیگ/آی‌پی متصل شد (${result.sub.servers.length} سرور شناسایی گردید).`);
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
      setSuccess(`ترافیک اشتراک «${sub.title}» بروزرسانی شد.`);
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'خطا در بروزرسانی ترافیک.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete(id, subTitle) {
    if (window.confirm(`آیا مطمئن هستید که می‌خواهید اشتراک «${subTitle}» را حذف کنید؟`)) {
      const updated = deleteVpnSub(id);
      setSubs(updated);
      if (selectedSubId === id) {
        setSelectedSubId(updated.length > 0 ? updated[0].id : null);
      }
      setSuccess('اشتراک حذف گردید.');
      if (onUpdated) onUpdated();
    }
  }

  // One-click bind current IP to the selected sub
  function handleConnectCurrentIpToSub(subId) {
    if (!currentProxyIp) {
      setError('آی‌پی پروکسی هنوز دریافت نشده است.');
      return;
    }
    bindIpToSub(currentProxyIp, subId);
    setSelectedSubId(subId);
    setSuccess(`آی‌پی فعلی (${currentProxyIp}) با موفقیت به این ساب متصل شد و از این پس ترافیک آن نمایش داده می‌شود.`);
    if (onUpdated) onUpdated();
  }

  function handleCopyRouting() {
    navigator.clipboard?.writeText(HAPP_ROUTING_URL);
    setCopiedRouting(true);
    setTimeout(() => setCopiedRouting(false), 2000);
  }

  const traffic = selectedSub?.traffic;
  const isSelectedConnectedToCurrentIp = detectedSub?.id === selectedSub?.id;

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                مدیریت اشتراک‌های فیلترشکن و اتصال به ساب
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                اتصال مستقیم کانفیگ/آی‌پی متصل فعلی به ساب مربوطه و نمایش ترافیک باقی‌مانده
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition"
            title="بستن (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Connection Status & Fast Connect Action Bar */}
        <div className="p-4 rounded-2xl bg-slate-800/90 border border-white/15 mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-sky-400 animate-pulse shrink-0" />
              <span className="text-gray-300">کانفیگ/آی‌پی فعال فعلی:</span>
              <span className="font-mono font-bold text-sky-300 text-sm" dir="ltr">
                {currentProxyIp || 'در حال دریافت آی‌پی...'}
              </span>
              {currentCountry && (
                <span className="text-gray-400 text-xs">({currentCountry})</span>
              )}
            </div>

            {detectedSub ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>متصل به ساب: {detectedSub.title}</span>
              </div>
            ) : (
              <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                هنوز به هیچ سابی وصل نشده است
              </span>
            )}
          </div>

          {/* Quick-connect Button if not connected or to switch binding */}
          {selectedSub && !isSelectedConnectedToCurrentIp && currentProxyIp && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-300">
                آیا این آی‌پی متعلق به ساب «<span className="text-white font-bold">{selectedSub.title}</span>» است؟
              </span>
              <button
                type="button"
                onClick={() => handleConnectCurrentIpToSub(selectedSub.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md"
              >
                <Link className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>اتصال این آی‌پی به این ساب</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
            <Check className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Subscription Tabs Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>اشتراک‌های ثبت‌شده ({subs.length}):</span>
            </span>
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 px-3 py-1.5 rounded-xl transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن ساب جدید</span>
            </button>
          </div>

          {subs.length === 0 ? (
            <div className="p-6 rounded-2xl bg-black/40 border border-white/10 text-center text-xs sm:text-sm text-gray-400">
              هنوز هیچ لینک سابی اضافه نشده است. لینک ساب خود را در فرم زیر وارد کنید تا متصل شود.
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {subs.map((s) => {
                const isSelected = selectedSub?.id === s.id;
                const isConnected = detectedSub?.id === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSubId(s.id);
                      setIsAddingNew(false);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition border ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/20 font-bold'
                        : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <span>{s.title}</span>
                    {isConnected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/60" title="متصل به اتصال فعلی شما" />
                    )}
                    {s.traffic?.remainingText && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-lg font-mono ${isSelected ? 'bg-black/20 text-slate-950 font-bold' : 'bg-black/40 text-emerald-300'}`}>
                        {s.traffic.remainingText}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Subscription Large Traffic Dashboard */}
        {selectedSub && !isAddingNew && (
          <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-black/50 border border-white/15 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-base sm:text-lg text-white">
                  {selectedSub.title}
                </span>

                {isSelectedConnectedToCurrentIp ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>متصل به آی‌پی فعلی</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleConnectCurrentIpToSub(selectedSub.id)}
                    className="flex items-center gap-1 text-xs bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-2.5 py-0.5 rounded-lg font-medium transition"
                  >
                    <Link className="w-3 h-3" />
                    <span>وصل کردن آی‌پی به این ساب</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRefreshSingle(selectedSub)}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition flex items-center gap-1 text-xs"
                  title="بروزرسانی ترافیک"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">بروزرسانی</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedSub.id, selectedSub.title)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                  title="حذف این ساب"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Big Statistics Grid */}
            {traffic && (
              <>
                <div className="grid grid-cols-3 gap-3 text-center py-2">
                  <div className="bg-slate-800/80 p-3 sm:p-4 rounded-2xl border border-emerald-500/20">
                    <span className="text-xs text-gray-400 block mb-1">حجم باقی‌مانده</span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-400">
                      {traffic.remainingText}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 sm:p-4 rounded-2xl border border-cyan-500/20">
                    <span className="text-xs text-gray-400 block mb-1">حجم مصرف‌شده</span>
                    <span className="text-lg sm:text-2xl font-bold text-cyan-300">
                      {traffic.usedText}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 sm:p-4 rounded-2xl border border-white/10">
                    <span className="text-xs text-gray-400 block mb-1">کل بسته اشتراک</span>
                    <span className="text-lg sm:text-2xl font-bold text-gray-200">
                      {traffic.totalText}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {traffic.total > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs text-gray-300 font-medium">
                      <span>درصد مصرف: {traffic.percentUsed}٪</span>
                      <span>باقی‌مانده: {traffic.percentRemaining}٪</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
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

                {/* Bottom Details Row */}
                <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm pt-2 text-gray-300 border-t border-white/10 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تاریخ انقضا: </span>
                    <span className="font-bold text-white">{traffic.expireFormatted}</span>
                    {traffic.daysLeft !== null && (
                      <span className="text-xs text-cyan-300 font-medium">
                        ({traffic.daysLeft > 0 ? `${traffic.daysLeft} روز باقی‌مانده` : 'منقضی'})
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 font-mono bg-white/5 px-2.5 py-1 rounded-xl">
                    {selectedSub.servers?.length || 0} سرور شناخته‌شده
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add New Subscription Form (Wide and clean) */}
        {(isAddingNew || subs.length === 0) && (
          <form onSubmit={handleFetch} className="mb-6 p-5 sm:p-6 rounded-2xl bg-black/50 border border-cyan-500/40 space-y-4">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>افزودن لینک ساب فیلترشکن جدید:</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                عنوان اشتراک (مثال: ساب همراه اول / ایرانسل / آلمان):
              </label>
              <input
                type="text"
                placeholder="مثلاً: ساب سرور اختصاصی آلمان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                آدرس لینک ساب (Subscription URL): <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="https://domain.com/api/v1/client/subscribe?token=... یا لینک V2ray/Hiddify/Happ"
                value={subUrl}
                onChange={(e) => setSubUrl(e.target.value)}
                required
                className="w-full bg-slate-800 border border-white/15 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition font-mono break-all"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {subs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 text-xs sm:text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
                >
                  انصراف
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl transition shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'در حال دریافت اطلاعات...' : 'استعلام و اتصال به این ساب'}
              </button>
            </div>
          </form>
        )}

        {/* Happ Routing Section */}
        <div className="pt-5 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-sky-400 flex items-center gap-1.5">
              <Route className="w-4 h-4" />
              <span>پروفایل روتینگ اختصاصی اپلیکیشن HAPP</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenRoutingModal) onOpenRoutingModal();
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              آموزش افزودن روتینگ
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyRouting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition"
            >
              {copiedRouting ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedRouting ? 'لینک روتینگ کپی شد!' : 'کپی لینک روتینگ HAPP'}</span>
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = HAPP_ROUTING_URL)}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition flex items-center gap-1.5"
              title="باز کردن مستقیم در برنامه Happ"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">باز کردن در HAPP</span>
            </button>
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs sm:text-sm font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
