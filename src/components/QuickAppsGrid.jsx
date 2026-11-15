import React, { useState, useEffect } from 'react';
import { Plus, X, Globe, Trash2, Edit2, Check } from 'lucide-react';
import { ICON_158 } from '../data/icon158';

const STORAGE_KEY = 'homepage_quick_apps_v2';

const DEFAULT_QUICK_APPS = [
  {
    id: 'app_1',
    url: 'http://192.168.0.158:1532/',
    icon: ICON_158
  },
  {
    id: 'app_2',
    url: 'http://192.168.0.4:1940/',
    icon: ''
  },
  {
    id: 'app_3',
    url: 'http://192.168.0.4:1930/',
    icon: ''
  },
  {
    id: 'app_4',
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Migrate from v1 if present
      const oldV1 = localStorage.getItem('homepage_quick_apps_v1');
      if (oldV1) {
        const parsed = JSON.parse(oldV1);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(a => ({
            id: a.id,
            url: a.url,
            icon: a.id === 'app_1' ? ICON_158 : (a.icon || '')
          }));
        }
      }
    } catch {}
    return DEFAULT_QUICK_APPS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
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

    const icon = formIcon.trim();

    if (editingApp) {
      setApps((prev) =>
        prev.map((a) =>
          a.id === editingApp.id
            ? { ...a, url: finalUrl, icon }
            : a
        )
      );
    } else {
      const newApp = {
        id: 'app_' + Date.now(),
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
    <div className="w-full">
      {/* 4 Columns Minimalist Grid - No Background Card, Icons Only */}
      <div className="grid grid-cols-4 gap-2 items-center justify-items-center">
        {apps.map((app) => {
          const hasCustomIcon = Boolean(app.icon);
          const fallbackFavicon = getFallbackIconUrl(app.url);
          const iconSrc = hasCustomIcon ? app.icon : fallbackFavicon;
          const isFailed = imgErrors[app.id];

          return (
            <div key={app.id} className="relative group flex items-center justify-center">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                title={app.url}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                {!isFailed && iconSrc ? (
                  <img
                    src={iconSrc}
                    alt={app.url}
                    className="w-7 h-7 object-contain drop-shadow transition-transform"
                    onError={() => {
                      setImgErrors((prev) => ({ ...prev, [app.id]: true }));
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#ffffff]/10 hover:bg-[#ffffff]/20 border border-[#ffffff]/15 text-[#38bdf8] transition">
                    <Globe className="w-4 h-4" />
                  </div>
                )}
              </a>

              {/* URL Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded-md bg-[#000000]/95 text-[#ffffff] text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-30 border border-[#ffffff]/15 shadow-xl">
                {app.url}
              </div>

              {/* Hover Actions (Edit / Delete) */}
              <div 
                className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[#000000]/95 rounded-md p-0.5 border border-[#ffffff]/20 shadow-lg z-20"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  onClick={(e) => openEditModal(app, e)}
                  className="p-0.5 text-[#9ca3af] hover:text-[#ffffff] rounded"
                  title="ویرایش آدرس"
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

        {/* Minimal Add Icon Button */}
        <button
          type="button"
          onClick={openAddModal}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9ca3af] hover:text-[#38bdf8] hover:scale-110 active:scale-95 transition-all"
          title="افزودن سایت جدید"
        >
          <div className="w-7 h-7 rounded-xl border border-dashed border-[#ffffff]/25 hover:border-[#38bdf8] flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
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
                <span>{editingApp ? 'ویرایش آدرس' : 'افزودن آدرس'}</span>
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
                  لینک مستقیم آیکون (اختیاری):
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
