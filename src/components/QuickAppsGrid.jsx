import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, ExternalLink, Trash2, Edit2, Check } from 'lucide-react';

const STORAGE_KEY = 'homepage_quick_apps_v1';

// Initial default links specified by user
const DEFAULT_QUICK_APPS = [
  {
    id: 'app_1',
    title: 'حکمت مدیا',
    url: 'http://192.168.0.158:1532/',
    icon: 'http://192.168.0.158:1532/icon.png'
  },
  {
    id: 'app_2',
    title: 'اتوماسیون اداری',
    url: 'http://192.168.0.4:1940/',
    icon: ''
  },
  {
    id: 'app_3',
    title: 'پایان‌نامه‌ها',
    url: 'http://192.168.0.4:1930/',
    icon: ''
  },
  {
    id: 'app_4',
    title: 'سیستم آموزش',
    url: 'http://192.168.0.4:1930/education',
    icon: ''
  }
];

export default function QuickAppsGrid() {
  const [apps, setApps] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return DEFAULT_QUICK_APPS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch {}
  }, [apps]);

  function openAddModal() {
    setEditingApp(null);
    setFormTitle('');
    setFormUrl('');
    setFormIcon('');
    setIsModalOpen(true);
  }

  function openEditModal(app, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingApp(app);
    setFormTitle(app.title || '');
    setFormUrl(app.url || '');
    setFormIcon(app.icon || '');
    setIsModalOpen(true);
  }

  function handleDelete(id, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  function handleSave(e) {
    e.preventDefault();
    if (!formUrl.trim()) return;

    let finalUrl = formUrl.trim();
    if (!/^(https?:\/\/|about:|chrome:\/\/|file:\/\/)/i.test(finalUrl)) {
      finalUrl = 'http://' + finalUrl;
    }

    const title = formTitle.trim() || new URL(finalUrl).hostname;
    const icon = formIcon.trim();

    if (editingApp) {
      setApps((prev) =>
        prev.map((a) =>
          a.id === editingApp.id
            ? { ...a, title, url: finalUrl, icon }
            : a
        )
      );
    } else {
      const newApp = {
        id: 'app_' + Date.now(),
        title,
        url: finalUrl,
        icon
      };
      setApps((prev) => [...prev, newApp]);
    }

    setIsModalOpen(false);
  }

  function getFallbackIconUrl(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}/favicon.ico`;
    } catch {
      return '';
    }
  }

  return (
    <div className="w-full bg-[#000000]/50 backdrop-blur-md border border-[#ffffff]/10 rounded-xl p-2 shadow-lg">
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="text-[11px] font-bold text-[#9ca3af] flex items-center gap-1">
          <Globe className="w-3 h-3 text-[#38bdf8]" />
          <span>سایت‌های پرکاربرد</span>
        </span>
        <button
          type="button"
          onClick={openAddModal}
          className="p-1 rounded-md text-[#9ca3af] hover:text-[#38bdf8] hover:bg-[#ffffff]/10 transition"
          title="افزودن سایت پرکاربرد"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Columns Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {apps.map((app) => {
          const hasCustomIcon = Boolean(app.icon);
          const fallbackFavicon = getFallbackIconUrl(app.url);
          const iconSrc = hasCustomIcon ? app.icon : fallbackFavicon;
          const isFailed = imgErrors[app.id];

          return (
            <div key={app.id} className="relative group">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${app.title}\n${app.url}`}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-[#ffffff]/5 hover:bg-[#ffffff]/15 border border-[#ffffff]/5 hover:border-[#38bdf8]/40 transition aspect-square"
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center overflow-hidden bg-[#000000]/30 shadow-inner">
                  {!isFailed && iconSrc ? (
                    <img
                      src={iconSrc}
                      alt={app.title}
                      className="w-full h-full object-contain p-0.5"
                      onError={() => {
                        setImgErrors((prev) => ({ ...prev, [app.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0284c7]/20 text-[#38bdf8] text-[10px] font-bold">
                      {app.title ? app.title.charAt(0).toUpperCase() : <Globe className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#e5e7eb] font-medium truncate w-full text-center mt-1 leading-tight">
                  {app.title}
                </span>
              </a>

              {/* Hover Actions overlay */}
              <div 
                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[#000000]/90 rounded-md p-0.5 border border-[#ffffff]/20 shadow-md z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  onClick={(e) => openEditModal(app, e)}
                  className="p-0.5 text-[#9ca3af] hover:text-[#ffffff] rounded"
                  title="ویرایش"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(app.id, e)}
                  className="p-0.5 text-[#f87171] hover:text-[#fca5a5] rounded"
                  title="حذف"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Card if empty or quick add slot */}
        <button
          type="button"
          onClick={openAddModal}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg border border-dashed border-[#ffffff]/15 hover:border-[#38bdf8]/50 text-[#9ca3af] hover:text-[#38bdf8] hover:bg-[#ffffff]/5 transition aspect-square"
          title="افزودن سایت"
        >
          <Plus className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">افزودن</span>
        </button>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/75 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="glass rounded-2xl p-4 w-full max-w-xs border border-[#ffffff]/20 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#ffffff]/10 mb-3">
              <span className="text-xs font-bold text-[#ffffff] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>{editingApp ? 'ویرایش سایت پرکاربرد' : 'افزودن سایت پرکاربرد'}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#9ca3af] hover:text-[#ffffff] rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#d1d5db] mb-1">
                  آدرس سایت (URL):
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="http://192.168.0.4:1940/"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-[#000000]/40 border border-[#ffffff]/15 rounded-xl px-2.5 py-1.5 text-xs text-[#ffffff] focus:outline-none focus:border-[#38bdf8] font-mono transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#d1d5db] mb-1">
                  عنوان / نام نمایشی:
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: اتوماسیون اداری"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#000000]/40 border border-[#ffffff]/15 rounded-xl px-2.5 py-1.5 text-xs text-[#ffffff] focus:outline-none focus:border-[#38bdf8] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#d1d5db] mb-1">
                  آدرس آیکون (اختیاری):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="http://.../icon.png یا خالی برای favicon"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  className="w-full bg-[#000000]/40 border border-[#ffffff]/15 rounded-xl px-2.5 py-1.5 text-xs text-[#ffffff] focus:outline-none focus:border-[#38bdf8] font-mono transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ffffff]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-[#d1d5db] hover:bg-[#ffffff]/10 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] transition flex items-center gap-1 shadow-md shadow-[#2563eb]/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ذخیره</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
