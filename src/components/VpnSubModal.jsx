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
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import {
  getSavedVpnSub,
  fetchVpnSubTraffic,
  clearVpnSub,
  HAPP_ROUTING_URL
} from '../services/vpnSubService';

export default function VpnSubModal({ isOpen, onClose, onUpdated, onOpenRoutingModal }) {
  const [subData, setSubData] = useState(getSavedVpnSub());
  const [subUrl, setSubUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedRouting, setCopiedRouting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getSavedVpnSub();
      setSubData(current);
      setSubUrl(current.subUrl || '');
      setTitle(current.title || '');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      const data = await fetchVpnSubTraffic(subUrl, title);
      setSubData(data);
      setSuccess('اطلاعات حجم و ترافیک با موفقیت دریافت و ذخیره شد.');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات از لینک ساب.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید لینک ساب ذخیره‌شده را حذف کنید؟')) {
      clearVpnSub();
      setSubData(getSavedVpnSub());
      setSubUrl('');
      setTitle('');
      setSuccess('اطلاعات لینک ساب با موفقیت پاک شد.');
      if (onUpdated) onUpdated();
    }
  }

  function handleCopyRouting() {
    navigator.clipboard?.writeText(HAPP_ROUTING_URL);
    setCopiedRouting(true);
    setTimeout(() => setCopiedRouting(false), 2000);
  }

  const traffic = subData?.traffic;
  const hasTraffic = traffic && (traffic.total > 0 || traffic.used > 0 || traffic.remaining > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-slate-900/95 border border-white/20 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                تنظیمات اشتراک فیلترشکن (لینک ساب)
              </h2>
              <p className="text-xs text-gray-400">
                استعلام و نمایش میزان حجم باقی‌مانده و ترافیک مخصوص آی‌پی پروکسی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
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

        {/* Traffic Statistics Card if available */}
        {traffic && (
          <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/15 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white">
                  {subData.title || 'وضعیت ترافیک اشتراک'}
                </span>
              </div>
              {subData.lastChecked && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  بروزرسانی: {new Date(subData.lastChecked).toLocaleTimeString('fa-IR')}
                </span>
              )}
            </div>

            {/* Volume Stats */}
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
                  <span>درصد مصرف: {traffic.percentUsed}٪</span>
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

            {/* Expiration Details */}
            {traffic.expireFormatted && (
              <div className="flex items-center justify-between text-xs pt-1 text-gray-300 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>تاریخ انقضا: </span>
                  <span className="font-semibold text-white">{traffic.expireFormatted}</span>
                </div>
                {traffic.daysLeft !== null && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      traffic.daysLeft < 5
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {traffic.daysLeft > 0
                      ? `${traffic.daysLeft} روز باقی‌مانده`
                      : 'منقضی شده یا نامحدود'}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleFetch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              عنوان اشتراک (اختیاری):
            </label>
            <input
              type="text"
              placeholder="مثلاً: اشتراک VIP آلمان"
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
              rows={3}
              placeholder="https://.../api/v1/client/subscribe?token=... یا لینک V2ray/Hiddify"
              value={subUrl}
              onChange={(e) => setSubUrl(e.target.value)}
              required
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition font-mono break-all"
              dir="ltr"
            />
          </div>

          {/* Form action buttons */}
          <div className="flex items-center justify-between pt-2">
            {subData.subUrl ? (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition"
                title="حذف اشتراک"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف لینک
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl transition shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'در حال استعلام...' : subData.subUrl ? 'بروزرسانی ترافیک' : 'استعلام و ذخیره'}
              </button>
            </div>
          </div>
        </form>

        {/* Happ Routing Quick Bar inside Modal */}
        <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
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
      </div>
    </div>
  );
}
