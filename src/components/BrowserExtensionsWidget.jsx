import React, { useState, useEffect } from 'react';
import { 
  Wrench, Settings, Plus, ExternalLink, Power, Check, X, 
  Trash2, Edit2, Wifi, Zap, Globe, Shield, AlertCircle, Copy
} from 'lucide-react';

const LUCIDE_ICONS = {
  Wifi,
  Zap,
  Settings,
  Wrench,
  Globe,
  Shield,
  Power
};

const DEFAULT_EXTENSIONS = [
  {
    id: 'tab-ip-badge',
    name: 'Mohrez Dual IP Inspector',
    desc: 'نمایش هوشمند ۲ آی‌پی در گوشه بالای صفحات وب (آی‌پی سرور هاست سایت + آی‌پی شناسایی‌شده شما)',
    url: 'about:debugging#/setup',
    icon: 'Wifi',
    color: 'from-cyan-600/30 to-blue-900/40 border-cyan-500/30',
    accentColor: '#06b6d4',
    isEnabled: true,
    isBuiltIn: true
  },
  {
    id: 'quick-autofill',
    name: 'Mohrez Quick Autofill',
    desc: 'دستیار هوشمند پر کردن خودکار فرم‌ها و فیلدهای متنی بر اساس دامنه با امکان ذخیره آنی',
    url: 'about:debugging#/setup',
    icon: 'Zap',
    color: 'from-purple-600/30 to-indigo-900/40 border-purple-500/30',
    accentColor: '#a855f7',
    isEnabled: true,
    isBuiltIn: true
  },
  {
    id: 'firefox-addons',
    name: 'مرکز افزونه‌های فایرفاکس (Add-ons)',
    desc: 'مدیریت، پیکربندی، به‌روزرسانی و حذف کلیه افزونه‌ها و تم‌های نصب‌شده مرورگر',
    url: 'about:addons',
    icon: 'Settings',
    color: 'from-amber-600/30 to-orange-900/40 border-orange-500/30',
    accentColor: '#f97316',
    isEnabled: true,
    isBuiltIn: true
  },
  {
    id: 'firefox-debugging',
    name: 'اشکال‌زدایی فایرفاکس (Debugging)',
    desc: 'بارگذاری موقت افزونه‌ها از سورس محلی (Load Temporary Add-on) و مشاهده کنسول لاگ‌ها',
    url: 'about:debugging#/setup',
    icon: 'Wrench',
    color: 'from-emerald-600/30 to-teal-900/40 border-emerald-500/30',
    accentColor: '#10b981',
    isEnabled: true,
    isBuiltIn: true
  }
];

export default function BrowserExtensionsWidget() {
  const [extensions, setExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_browser_extensions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge defaults in case new built-in extensions were added
          const existingIds = new Set(parsed.map(e => e.id));
          const missing = DEFAULT_EXTENSIONS.filter(d => !existingIds.has(d.id));
          return [...parsed, ...missing];
        }
      }
    } catch {}
    return DEFAULT_EXTENSIONS;
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExt, setEditingExt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    desc: '',
    icon: 'Wrench'
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('homepage_browser_extensions', JSON.stringify(extensions));
  }, [extensions]);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleToggleExtension(id) {
    setExtensions((prev) =>
      prev.map((ext) => {
        if (ext.id !== id) return ext;
        const nextState = ext.isEnabled === false ? true : false;

        // 1. Dispatch custom event for extensions
        window.dispatchEvent(
          new CustomEvent('MOHREZ_EXTENSION_STATE_CHANGED', {
            detail: {
              id: ext.id,
              title: ext.name,
              url: ext.url,
              isEnabled: nextState
            }
          })
        );

        // 2. Persist in localStorage dictionary
        try {
          const stored = JSON.parse(localStorage.getItem('mqa_extension_states') || '{}');
          stored[ext.id] = nextState;
          if (ext.name) stored[ext.name.toLowerCase()] = nextState;
          if (ext.url) stored[ext.url] = nextState;
          localStorage.setItem('mqa_extension_states', JSON.stringify(stored));
        } catch (e) {}

        showToast(`افزونه «${ext.name}» با موفقیت ${nextState ? 'فعال (روشن)' : 'غیرفعال (خاموش)'} شد.`);
        return { ...ext, isEnabled: nextState };
      })
    );
  }

  async function handleOpenUrl(url) {
    if (!url) return;
    const targetUrl = url.trim();
    const isInternalScheme = /^(about:|chrome:\/\/|edge:\/\/)/i.test(targetUrl);

    if (isInternalScheme) {
      let opened = false;
      // 1. Python Site IP service on 23159
      try {
        const res = await fetch(`http://127.0.0.1:23159/api/open-url?url=${encodeURIComponent(targetUrl)}`, {
          signal: AbortSignal.timeout(1500)
        });
        if (res.ok) opened = true;
      } catch (err) {}

      // 2. Windows Tools Agent fallback on 23157
      if (!opened) {
        try {
          const res = await fetch(`http://127.0.0.1:23157/api/open-url?url=${encodeURIComponent(targetUrl)}`, {
            signal: AbortSignal.timeout(1500)
          });
          if (res.ok) opened = true;
        } catch (err) {}
      }

      if (opened) {
        showToast(`در حال باز کردن «${targetUrl}» در تب جدید فایرفاکس...`);
        return;
      }

      // 3. Fallback: Copy to clipboard and inform user
      if (navigator.clipboard) {
        navigator.clipboard.writeText(targetUrl).then(() => {
          showToast(`آدرس «${targetUrl}» در کلیپ‌بورد کپی شد. فایرفاکس به دلایل امنیتی لینک مستقیم به about: را مسدود می‌کند؛ لطفاً آن را در آدرس‌بار Paste کنید.`);
        }).catch(() => {});
      }
    } else {
      let finalUrl = targetUrl;
      if (!/^(https?:\/\/|file:\/\/\/|moz-extension:\/\/|ftp:\/\/)/i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      window.open(finalUrl, '_blank');
    }
  }

  function handleOpenModal(ext = null) {
    if (ext) {
      setEditingExt(ext);
      setFormData({
        name: ext.name || '',
        url: ext.url || '',
        desc: ext.desc || '',
        icon: ext.icon || 'Wrench'
      });
    } else {
      setEditingExt(null);
      setFormData({
        name: '',
        url: '',
        desc: '',
        icon: 'Wrench'
      });
    }
    setIsModalOpen(true);
  }

  function handleSaveForm(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    if (editingExt) {
      setExtensions((prev) =>
        prev.map((item) =>
          item.id === editingExt.id
            ? { ...item, ...formData }
            : item
        )
      );
      showToast(`افزونه «${formData.name}» به‌روزرسانی شد.`);
    } else {
      const newExt = {
        id: 'ext_' + Date.now(),
        ...formData,
        color: 'from-slate-700/30 to-slate-900/40 border-white/20',
        accentColor: '#38bdf8',
        isEnabled: true,
        isBuiltIn: false
      };
      setExtensions((prev) => [...prev, newExt]);
      showToast(`افزونه «${formData.name}» با موفقیت اضافه شد.`);
    }

    setIsModalOpen(false);
  }

  function handleDelete(id, name) {
    if (window.confirm(`آیا از حذف «${name}» از فهرست مطمئن هستید؟`)) {
      setExtensions((prev) => prev.filter((item) => item.id !== id));
      showToast(`افزونه «${name}» حذف شد.`);
    }
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-5 animate-fade-in" dir="rtl">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-cyan-900/30">
            <Power className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>مدیریت افزونه‌های مرورگر (Browser Extensions)</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal border border-cyan-500/30">
                {extensions.filter(e => e.isEnabled !== false).length} فعال از {extensions.length}
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              خاموش و روشن کردن آنی افزونه‌ها، عیب‌یابی و دسترسی سریع به پنل‌های فایرفاکس
            </p>
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleOpenUrl('about:addons')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600/20 text-orange-300 border border-orange-500/30 hover:bg-orange-600/30 transition shadow-sm font-semibold"
            title="باز کردن صفحه رسمی افزونه‌های فایرفاکس"
          >
            <Settings className="w-3.5 h-3.5 text-orange-400" />
            <span>about:addons</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenUrl('about:debugging#/setup')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition shadow-sm font-semibold"
            title="باز کردن کنسول اشکال‌زدایی و بارگذاری موقت افزونه‌ها"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>about:debugging</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-700/30 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن افزونه</span>
          </button>
        </div>
      </div>

      {/* Extensions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {extensions.map((ext) => {
          const IconComp = LUCIDE_ICONS[ext.icon] || Wrench;
          const isEnabled = ext.isEnabled !== false;

          return (
            <div
              key={ext.id}
              className={`glass rounded-2xl p-4 border transition-all duration-200 relative flex flex-col justify-between gap-3 ${
                isEnabled
                  ? 'border-white/15 bg-gradient-to-br ' + (ext.color || 'from-slate-800/40 to-slate-900/60') + ' shadow-lg'
                  : 'border-rose-500/25 bg-black/40 opacity-60 grayscale-[35%]'
              }`}
            >
              {/* Card Header: Icon, Title & Toggle Switch */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2.5 rounded-xl border border-white/15 shrink-0 flex items-center justify-center shadow-md"
                    style={{ backgroundColor: (ext.accentColor || '#06b6d4') + '33' }}
                  >
                    <IconComp className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{ext.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>{isEnabled ? 'روشن' : 'خاموش'}</span>
                      </span>
                    </h4>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {ext.desc}
                    </p>
                  </div>
                </div>

                {/* The ON/OFF Toggle Switch */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleExtension(ext.id)}
                    title={isEnabled ? 'کلیک جهت خاموش کردن افزونه' : 'کلیک جهت روشن کردن افزونه'}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-all cursor-pointer shadow-inner border border-white/20 ${
                      isEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700/80 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-all" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isEnabled ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
              </div>

              {/* Card Footer: URL & Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                {/* URL Pill */}
                <button
                  type="button"
                  onClick={() => handleOpenUrl(ext.url)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white border border-white/10 font-mono text-[11px] transition max-w-[240px] truncate"
                  title="کلیک برای باز کردن صفحه"
                >
                  <ExternalLink className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate" dir="ltr">{ext.url}</span>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenUrl(ext.url)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-[11px] font-semibold"
                  >
                    باز کردن
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenModal(ext)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    title="ویرایش مشخصات"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!ext.isBuiltIn && (
                    <button
                      type="button"
                      onClick={() => handleDelete(ext.id, ext.name)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                      title="حذف افزونه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Extension Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass rounded-3xl p-6 w-full max-w-md border border-white/20 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {editingExt ? 'ویرایش مشخصات افزونه' : 'افزودن افزونه جدید'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  نام افزونه:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: UBlock Origin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  آدرس تنظیمات یا صفحه افزونه (URL):
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="about:debugging#/setup یا moz-extension://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  پشتیبانی از آدرس‌های داخلی فایرفاکس (<code className="text-cyan-300">about:debugging</code>، <code className="text-cyan-300">about:addons</code>، <code className="text-cyan-300">moz-extension://</code>)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  توضیح کوتاه کارکرد:
                </label>
                <textarea
                  rows="2"
                  placeholder="توضیح مختصری درباره وظیفه و عملکرد افزونه..."
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  آیکون:
                </label>
                <div className="flex gap-2">
                  {['Wifi', 'Zap', 'Settings', 'Wrench', 'Shield', 'Globe'].map((icName) => {
                    const Comp = LUCIDE_ICONS[icName];
                    const isSel = formData.icon === icName;
                    return (
                      <button
                        key={icName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: icName })}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition ${
                          isSel
                            ? 'bg-cyan-600/40 border-cyan-400 text-white shadow-lg'
                            : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ذخیره افزونه</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900/95 border border-cyan-500/40 text-cyan-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-medium backdrop-blur-md animate-fade-in flex items-center gap-2 max-w-md">
          <Power className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
