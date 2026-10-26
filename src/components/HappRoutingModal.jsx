import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, ExternalLink, Route, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import { HAPP_ROUTING_URL } from '../services/vpnSubService';

export default function HappRoutingModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

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

  function handleCopy() {
    navigator.clipboard?.writeText(HAPP_ROUTING_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenDirect() {
    window.location.href = HAPP_ROUTING_URL;
  }

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-y-auto p-6 sm:p-8 shadow-2xl text-white relative scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                آموزش و افزودن روتینگ پروفایل HAPP
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                مسیریابی هوشمند برای دور زدن تحریم‌های گوگل و آنتی‌گرویتی همراه با ترافیک مستقیم ایران
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

        {/* Action Buttons (Copy & Direct Open) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/50 via-slate-800/60 to-indigo-950/50 border border-sky-500/30 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCopy}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 transition shadow-lg shadow-sky-500/20"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                  <span>لینک روتینگ کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی لینک روتینگ پروفایل HAPP</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenDirect}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white transition"
              title="تلاش برای باز کردن مستقیم در نرم‌افزار Happ"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span>باز کردن در HAPP</span>
            </button>
          </div>

          <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 text-xs font-mono text-gray-300 break-all select-all text-left" dir="ltr">
            {HAPP_ROUTING_URL.substring(0, 80)}...
          </div>
        </div>

        {/* Step-by-Step Visual Tutorial */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>مراحل افزودن روتینگ در برنامه HAPP (گام به گام):</span>
          </h3>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/30 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                ۱
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <span className="font-bold text-white block">کپی لینک روتینگ</span>
                <p className="text-gray-300 leading-relaxed text-xs">
                  روی دکمه آبی بالای صفحه (کپی لینک روتینگ) کلیک کنید تا آدرس <code className="font-mono text-sky-300">happ://routing/add/...</code> در کلیپ‌بورد ذخیره شود.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/30 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                ۲
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <span className="font-bold text-white block">ورود به برنامه HAPP</span>
                <p className="text-gray-300 leading-relaxed text-xs">
                  برنامه <strong>HAPP</strong> را باز کنید. در اغلب نسخه‌ها، با باز کردن برنامه پیام شناسایی خودکار روتینگ ظاهر می‌شود. اگر ظاهر نشد، به زبانه <strong>Routing (مسیریابی)</strong> بروید.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/30 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                ۳
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <span className="font-bold text-white block">افزودن و ذخیره روتینگ</span>
                <p className="text-gray-300 leading-relaxed text-xs">
                  روی دکمه <strong>+ (افزودن)</strong> کلیک کرده یا لینک را پیست نمایید. روتینگی با عنوان <strong>Default</strong> به لیست اضافه می‌شود.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/30 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                ۴
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <span className="font-bold text-white block">فعال‌سازی پروفایل روتینگ</span>
                <p className="text-gray-300 leading-relaxed text-xs">
                  پروفایل روتینگ اضافه شده را به عنوان روتینگ فعال انتخاب کنید. از این پس فقط ابزارهای هوش مصنوعی و سرویس‌های تحریمی از فیلترشکن رد می‌شوند و سایر اینترنت مستقیم باز می‌شود.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Breakdown Details */}
        <div className="border-t border-white/10 pt-5 space-y-3">
          <h3 className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>مشخصات و قوانین تنظیم‌شده در این روتینگ:</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm">
            {/* Proxy Rules */}
            <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/25 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <ShieldCheck className="w-4 h-4" />
                <span>سایت‌ها و اپ‌های تحت پروکسی (Proxy):</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li><code className="text-cyan-300">gemini.google.com</code> و AI Studio</li>
                <li><code className="text-cyan-300">antigravity.google</code> و APIهای جمنای</li>
                <li>فرآیندها: <code className="text-cyan-300">Antigravity.exe</code></li>
                <li>تلگرام تحت وب و سرویس‌های استعلام IP</li>
              </ul>
            </div>

            {/* Direct Rules */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Zap className="w-4 h-4" />
                <span>ترافیک مستقیم بدون فیلترشکن (Direct):</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                <li>سایت‌های ایرانی (<code className="text-emerald-300">.ir</code> و داخلی)</li>
                <li>آی‌پی‌های محلی (192.168, 10.0, 172.16)</li>
                <li>مرورگرهای Firefox, Chrome, Edge</li>
                <li>DNS ایمن Cloudflare DoH و Google DoU</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Close Button */}
        <div className="flex justify-end pt-5 mt-5 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition"
          >
            متوجه شدم / بستن
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
