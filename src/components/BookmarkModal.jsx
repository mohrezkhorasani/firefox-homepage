import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Bookmark, Palette, Tag, ExternalLink } from 'lucide-react';

const GRADIENT_PRESETS = [
  { label: 'آبی اقیانوسی', value: 'from-blue-600/30 to-indigo-900/40 border-blue-500/30', color: '#3b82f6' },
  { label: 'زمردی حکمت', value: 'from-emerald-600/30 to-teal-900/40 border-emerald-500/30', color: '#10b981' },
  { label: 'بنفش سایبر', value: 'from-violet-600/30 to-purple-900/40 border-violet-400/30', color: '#8b5cf6' },
  { label: 'نارنجی ایتا', value: 'from-orange-600/30 to-amber-900/40 border-orange-500/30', color: '#f97316' },
  { label: 'قرمز پویان', value: 'from-rose-600/30 to-red-900/40 border-rose-400/30', color: '#e11d48' },
  { label: 'فیروزه‌ای', value: 'from-cyan-600/30 to-blue-900/40 border-cyan-400/30', color: '#06b6d4' },
  { label: 'تاریک شیشه‌ای', value: 'from-slate-700/30 to-slate-900/40 border-white/20', color: '#64748b' }
];

export default function BookmarkModal({
  isOpen,
  onClose,
  bookmark,
  onSave,
  onDelete,
  allTags,
  activePage
}) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    desc: '',
    tags: [],
    bgGradient: GRADIENT_PRESETS[0].value,
    accentColor: GRADIENT_PRESETS[0].color,
    iconType: 'lucide',
    iconValue: 'Bookmark',
    page: activePage || 'home'
  });

  useEffect(() => {
    if (bookmark) {
      setFormData({
        ...bookmark,
        tags: bookmark.tags || [],
        page: bookmark.page || activePage || 'home'
      });
    } else {
      setFormData({
        title: '',
        url: '',
        desc: '',
        tags: [],
        bgGradient: GRADIENT_PRESETS[0].value,
        accentColor: GRADIENT_PRESETS[0].color,
        iconType: 'lucide',
        iconValue: 'Bookmark',
        page: activePage || 'home'
      });
    }
  }, [bookmark, isOpen, activePage]);

  if (!isOpen) return null;

  function toggleTag(tagId) {
    if (tagId === 'all') return;
    setFormData((prev) => {
      const exists = prev.tags.includes(tagId);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tagId) : [...prev.tags, tagId]
      };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) return;

    let finalUrl = formData.url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    onSave({
      ...formData,
      id: bookmark?.id || 'bm_' + Date.now(),
      url: finalUrl
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass rounded-3xl p-6 w-full max-w-lg border border-white/20 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {bookmark ? 'ویرایش بوکمارک' : 'افزودن بوکمارک جدید'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عنوان سایت / سرویس:
            </label>
            <input
              type="text"
              required
              placeholder="مثلاً: ChatGPT"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              آدرس وب‌سایت (URL):
            </label>
            <input
              type="text"
              required
              dir="ltr"
              placeholder="https://example.com"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              توضیح کوتاه:
            </label>
            <input
              type="text"
              placeholder="مثلاً: هوش مصنوعی OpenAI"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          {/* Tags Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              تگ‌ها (می‌توانید چند مورد انتخاب کنید):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {allTags
                .filter((t) => t.id !== 'all')
                .map((t) => {
                  const isChecked = formData.tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1 ${
                        isChecked
                          ? 'bg-cyan-600/40 border-cyan-400 text-white shadow'
                          : 'glass-subtle border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-cyan-300" />}
                      <span>{t.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Background Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              تم رنگی و بکگراند کارت:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {GRADIENT_PRESETS.map((gp, i) => {
                const isSelected = formData.bgGradient === gp.value;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, bgGradient: gp.value, accentColor: gp.color })}
                    className={`h-9 rounded-xl border flex items-center justify-center transition ${
                      isSelected ? 'ring-2 ring-cyan-400 scale-105 border-white' : 'border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: gp.color + '44' }}
                    title={gp.label}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              لینک آیکون / لوگو (اختیاری):
            </label>
            <input
              type="text"
              dir="ltr"
              placeholder="https://.../logo.svg"
              value={formData.iconType === 'image' ? formData.iconValue : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val.trim()) {
                  setFormData({ ...formData, iconType: 'image', iconValue: val });
                } else {
                  setFormData({ ...formData, iconType: 'lucide', iconValue: 'Bookmark' });
                }
              }}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {bookmark && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(bookmark.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                ذخیره
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
