import React, { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw, CheckCircle, AlertCircle, Unlink, ExternalLink, HelpCircle } from 'lucide-react';
import { getGoogleConfig, syncGoogleCalendar, disconnectGoogleAccount } from '../services/calendarService';

export default function GoogleAccountModal({ isOpen, onClose, onUpdated }) {
  const [config, setConfig] = useState(getGoogleConfig());
  const [email, setEmail] = useState('');
  const [icalUrl, setIcalUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getGoogleConfig();
      setConfig(current);
      setEmail(current.email || '');
      setIcalUrl(current.icalUrl || '');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSync(e) {
    if (e) e.preventDefault();
    if (!icalUrl.trim()) {
      setError('لطفاً آدرس iCal تقویم گوگل را وارد کنید.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await syncGoogleCalendar(icalUrl, email);
      setConfig(result.config);
      setSuccess(`همگام‌سازی با موفقیت انجام شد (${result.events.length} رویداد دریافت گردید).`);
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.message || 'خطا در برقراری ارتباط با تقویم گوگل.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDisconnect() {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید اتصال به حساب گوگل کلندر را قطع کنید؟ رویدادهای ذخیره‌شده پاک خواهند شد.')) {
      disconnectGoogleAccount();
      setConfig(getGoogleConfig());
      setEmail('');
      setIcalUrl('');
      setSuccess('اتصال با حساب گوگل با موفقیت قطع گردید.');
      if (onUpdated) onUpdated();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-slate-900/95 border border-white/20 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-white relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                اتصال به تقویم گوگل (Google Calendar)
              </h2>
              <p className="text-xs text-gray-400">
                همگام‌سازی رویدادها و وظایف تقویم گوگل با داشبورد
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

        {/* Status indicator if connected */}
        {config.connected && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">متصل به تقویم: </span>
                <span>{config.email || 'حساب کاربری فعال'}</span>
                {config.lastSync && (
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    آخرین بروزرسانی: {new Date(config.lastSync).toLocaleTimeString('fa-IR')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
              title="قطع اتصال"
            >
              <Unlink className="w-3.5 h-3.5" />
              قطع اتصال
            </button>
          </div>
        )}

        {/* Success or Error messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSync} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              نام یا ایمیل حساب گوگل (اختیاری):
            </label>
            <input
              type="text"
              placeholder="مثال: myname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
              dir="ltr"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-300">
                آدرس تقویم گوگل (Secret Address in iCal format): <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <HelpCircle className="w-3 h-3" />
                راهنمای دریافت لینک
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              required
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition font-mono break-all"
              dir="ltr"
            />
          </div>

          {/* Help box */}
          {showHelp && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200/90 space-y-1.5 leading-relaxed">
              <p className="font-bold text-cyan-300">نحوه دریافت آدرس تقویم اختصاصی گوگل:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-300">
                <li>وارد سایت Google Calendar شوید.</li>
                <li>در ستون سمت چپ، ماوس را روی تقویم خود ببرید و روی سه نقطه کلیک کنید.</li>
                <li>گزینه <span className="text-white font-semibold">Settings and sharing</span> را انتخاب نمایید.</li>
                <li>به بخش <span className="text-white font-semibold">Integrate calendar</span> اسکرول کنید.</li>
                <li>آدرس کادر <span className="text-cyan-300 font-semibold">Secret address in iCal format</span> را کپی کرده و در این کادر قرار دهید.</li>
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition"
            >
              انصراف / بستن
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl transition shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'در حال همگام‌سازی...' : config.connected ? 'بروزرسانی رویدادها' : 'اتصال و دریافت رویدادها'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
