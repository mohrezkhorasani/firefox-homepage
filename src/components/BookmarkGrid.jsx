import React, { useState } from 'react';
import { 
  Server, KeyRound, Globe, MessageCircle, BookOpen, Bot, 
  Waves, Leaf, ShieldCheck, Zap, MessageSquare, Send, 
  HardDrive, Sparkles, Wifi, Bookmark as BookmarkIcon, 
  Edit2, Palette, Trash2, Image as ImageIcon, X, Check
} from 'lucide-react';

const LUCIDE_ICONS = {
  Server,
  KeyRound,
  Globe,
  MessageCircle,
  BookOpen,
  Bot,
  Waves,
  Leaf,
  ShieldCheck,
  Zap,
  MessageSquare,
  Send,
  HardDrive,
  Sparkles,
  Wifi,
  Bookmark: BookmarkIcon
};

export default function BookmarkGrid({ 
  bookmarks, 
  activeTag, 
  onEditBookmark, 
  onAddNew,
  onDeleteBookmark,
  onUpdateBookmarkColor,
  onUpdateBookmarkLogo
}) {
  const [editingLogoBm, setEditingLogoBm] = useState(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');

  const filtered = bookmarks.filter((bm) => {
    if (activeTag && activeTag !== 'all') {
      return bm.tags && bm.tags.includes(activeTag);
    }
    return true;
  });

  function handleOpenLogoModal(bm) {
    setEditingLogoBm(bm);
    setLogoUrlInput(bm.iconType === 'image' ? (bm.iconValue || '') : '');
  }

  function handleSaveLogo(e) {
    e.preventDefault();
    if (!editingLogoBm) return;
    onUpdateBookmarkLogo(editingLogoBm.id, logoUrlInput.trim());
    setEditingLogoBm(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((bm) => {
          const LucideComp = LUCIDE_ICONS[bm.iconValue] || LUCIDE_ICONS[bm.fallbackIcon] || BookmarkIcon;
          const customBg = bm.customBgColor || null;

          return (
            <div
              key={bm.id}
              style={customBg ? { backgroundColor: customBg } : {}}
              className="glass flex items-center p-3 rounded-xl gap-3 group relative cursor-pointer border border-white/10 hover:border-white/30 transition text-shadow"
              onClick={() => { window.location.href = bm.url; }}
              title={bm.title}
            >
              {/* Sticky Tooltip on Hover showing Full Name */}
              <div 
                className="absolute -top-8 right-2 max-w-[240px] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-30 px-2.5 py-1 rounded-lg bg-black/95 text-white text-xs font-bold shadow-2xl border border-cyan-400/50 whitespace-nowrap overflow-hidden text-ellipsis text-right"
              >
                {bm.title}
              </div>

              {/* Site Icon */}
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                {bm.iconType === 'image' && bm.iconValue ? (
                  <img
                    src={bm.iconValue}
                    alt={bm.title}
                    className="site-icon w-6 h-6 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : bm.iconType === 'fontawesome' && bm.iconValue ? (
                  <i className={`${bm.iconValue} text-lg`} />
                ) : (
                  <LucideComp className="w-5 h-5 text-cyan-300" />
                )}
                <LucideComp className="w-5 h-5 text-cyan-300 hidden" />
              </div>

              {/* Title */}
              <span className="font-bold text-sm truncate flex-1 text-white">
                {bm.title}
              </span>

              {/* Hover Actions: Logo + Color Picker + Edit + Delete */}
              <div 
                className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Logo Editor Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenLogoModal(bm);
                  }}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-black/50 rounded transition"
                  title="تغییر آیکون / لوگو"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>

                {/* Color Picker button */}
                <label
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-black/50 rounded cursor-pointer relative flex items-center justify-center transition"
                  title="تغییر رنگ پس‌زمینه"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <input
                    type="color"
                    value={bm.customBgColor?.startsWith('#') ? bm.customBgColor : '#1e293b'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateBookmarkColor(bm.id, e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
                  />
                </label>

                {/* Edit Pencil */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBookmark(bm);
                  }}
                  className="p-1.5 text-gray-300 hover:text-white hover:bg-black/50 rounded transition"
                  title="ویرایش مشخصات سایت"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Trash */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`آیا از حذف "${bm.title}" مطمئن هستید؟`)) {
                      onDeleteBookmark(bm.id);
                    }
                  }}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-black/50 rounded transition"
                  title="حذف سایت"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Card */}
        <button
          type="button"
          onClick={onAddNew}
          className="glass flex items-center justify-center p-3 rounded-xl gap-2 border border-dashed border-white/20 hover:border-cyan-400 text-gray-300 hover:text-white transition text-sm font-bold"
        >
          <i className="fas fa-plus text-xs"></i>
          <span>افزودن سایت</span>
        </button>
      </div>

      {/* Edit Logo Modal */}
      {editingLogoBm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setEditingLogoBm(null)}
        >
          <div 
            className="glass rounded-2xl p-5 w-full max-w-sm border border-white/20 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>تغییر لوگوی {editingLogoBm.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingLogoBm(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLogo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  آدرس اینترنتی تصویر / لوگو (URL):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="https://example.com/logo.png"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono transition"
                  autoFocus
                />
              </div>

              {/* Preview if provided */}
              {logoUrlInput.trim() && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-black/30 border border-white/10">
                  <span className="text-xs text-gray-400">پیش‌نمایش:</span>
                  <img 
                    src={logoUrlInput.trim()} 
                    alt="Preview" 
                    className="w-7 h-7 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLogoBm(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:bg-white/10 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  ثبت لوگو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
