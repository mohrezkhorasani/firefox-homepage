import React, { useState, useEffect } from 'react';
import { 
  StickyNote, Layers, ExternalLink, HardDrive 
} from 'lucide-react';
import SystemDrivesWidget from './SystemDrivesWidget';
import GoogleAccountModal from './GoogleAccountModal';
import { getGoogleConfig, getGoogleEvents } from '../services/calendarService';
import { Calendar, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ToolsPage({ pages, onRemovePage }) {
  // Notes State
  const [note, setNote] = useState(() => {
    return localStorage.getItem('homepage_scratchpad') || '';
  });

  // Google Calendar Integration State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleConfig, setGoogleConfig] = useState(getGoogleConfig());
  const [googleEvents, setGoogleEvents] = useState(getGoogleEvents());

  useEffect(() => {
    localStorage.setItem('homepage_scratchpad', note);
  }, [note]);

  function refreshGoogle() {
    setGoogleConfig(getGoogleConfig());
    setGoogleEvents(getGoogleEvents());
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* 1. System Hard Drives (via Python Windows Agent port 23157) */}
      <SystemDrivesWidget />

      {/* 2. Google Calendar & Tasks Integration (replaces local To-Do) */}
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">رویدادها و وظایف گوگل</h3>
              <p className="text-[11px] text-slate-400">
                {googleConfig.connected ? googleConfig.email || 'حساب متصل' : 'عدم اتصال به گوگل'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGoogleModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-md flex items-center gap-1.5"
          >
            {googleConfig.connected ? 'تنظیمات اتصال' : 'اتصال به گوگل'}
          </button>
        </div>

        {/* Events / Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {!googleConfig.connected ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Calendar className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-sm font-semibold text-slate-200 mb-1">
                اتصال مستقیم به Google Calendar
              </p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                با اتصال حساب گوگل، رویدادها، یادآورها و تسک‌های ثبت‌شده در گوگل مستقیماً در داشبورد شما همگام‌سازی می‌شوند.
              </p>
              <button
                onClick={() => setIsGoogleModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium transition shadow-lg"
              >
                اتصال تقویم گوگل
              </button>
            </div>
          ) : googleEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-12">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
              <p className="text-xs">هیچ رویدادی در این بازه دریافت نشد.</p>
              <button
                onClick={() => setIsGoogleModalOpen(true)}
                className="text-xs text-blue-400 hover:underline mt-2"
              >
                بررسی مجدد همگام‌سازی
              </button>
            </div>
          ) : (
            googleEvents.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl glass-subtle border border-white/5 hover:border-white/20 transition flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {evt.title}
                    </h4>
                    {evt.time && (
                      <span className="text-[11px] font-mono text-cyan-300 shrink-0">
                        {evt.time}
                      </span>
                    )}
                  </div>
                  {evt.dateStr && (
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {evt.dateStr}
                    </span>
                  )}
                  {evt.description && (
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {evt.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>تعداد کل رویدادها: {googleEvents.length}</span>
          {googleConfig.lastSync && (
            <span>آخرین سینک: {new Date(googleConfig.lastSync).toLocaleTimeString('fa-IR')}</span>
          )}
        </div>
      </div>

      {/* 3. Scratchpad / Notes */}
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">دفترچه یادداشت سریع</h3>
          </div>
          <span className="text-[11px] text-slate-400">ذخیره خودکار</span>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="یادداشت‌ها، دستورات شل، لینک‌های موقت یا متن دلخواه را اینجا بنویسید (در مرورگر ذخیره می‌شود)..."
          className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-amber-400/50 resize-none font-mono leading-relaxed"
        />

        <div className="flex justify-between items-center pt-3 text-xs text-slate-400 border-t border-white/10">
          <span>تعداد کلمات: {note.trim() ? note.trim().split(/\s+/).length : 0}</span>
          <button
            onClick={() => setNote('')}
            className="text-rose-400 hover:underline text-[11px]"
          >
            پاک کردن کل یادداشت
          </button>
        </div>
      </div>

      {/* Google Account Modal Dialog */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onUpdated={refreshGoogle}
      />
    </div>
  );
}
