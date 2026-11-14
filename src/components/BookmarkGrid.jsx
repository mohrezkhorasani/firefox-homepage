import React, { useState } from 'react';
import { 
  Server, KeyRound, Globe, MessageCircle, BookOpen, Bot, 
  Waves, Leaf, ShieldCheck, Zap, MessageSquare, Send, 
  HardDrive, Sparkles, Wifi, Bookmark as BookmarkIcon, 
  Edit2, Palette, Trash2, Image as ImageIcon, X, Check,
  Wrench, Settings, RotateCcw, GripVertical
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
  Wrench,
  Settings,
  Bookmark: BookmarkIcon
};

function normalizeHex(input) {
  if (!input) return '';
  let str = input.trim();
  if (!str.startsWith('#') && !str.startsWith('rgb') && !str.startsWith('hsl')) {
    str = '#' + str;
  }
  return str;
}

function isValidColor(color) {
  if (!color) return false;
  // Match #rgb, #rgba, #rrggbb, #rrggbbaa
  const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color);
  if (isHex) return true;
  // Match rgb(...) or rgba(...)
  if (/^rgba?\(.+\)$/i.test(color)) return true;
  return false;
}

const PRESET_COLORS = [
  { name: 'اسلیت پیش‌فرض', hex: '#1e293b' },
  { name: 'نفتی تیره', hex: '#0f172a' },
  { name: 'کربن مشکی', hex: '#111827' },
  { name: 'آبی رویال', hex: '#2563eb' },
  { name: 'آبی اقیانوسی', hex: '#0284c7' },
  { name: 'فیروزه‌ای', hex: '#0d9488' },
  { name: 'زمردی', hex: '#059669' },
  { name: 'سبز تیره', hex: '#065f46' },
  { name: 'کهربایی', hex: '#d97706' },
  { name: 'نارنجی پررنگ', hex: '#ea580c' },
  { name: 'رز قرمز', hex: '#e11d48' },
  { name: 'قرمز پویان', hex: '#b91c1c' },
  { name: 'سرخابی', hex: '#c026d3' },
  { name: 'بنفش سایبر', hex: '#7c3aed' },
  { name: 'نیلی کبالت', hex: '#4338ca' },
  { name: 'خاکستری سرد', hex: '#374151' }
];

export default function BookmarkGrid({ 
  bookmarks, 
  activeTag, 
  onEditBookmark, 
  onAddNew,
  onDeleteBookmark,
  onUpdateBookmarkColor,
  onUpdateBookmarkLogo,
  onReorderBookmarks
}) {
  const [editingLogoBm, setEditingLogoBm] = useState(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [editingColorBm, setEditingColorBm] = useState(null);
  const [hexColorInput, setHexColorInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  function handleOpenColorModal(bm) {
    setEditingColorBm(bm);
    setHexColorInput(bm.customBgColor || '#1e293b');
  }

  function handleSaveColor(e) {
    e.preventDefault();
    if (!editingColorBm) return;
    const trimmed = hexColorInput.trim();
    if (!trimmed) {
      onUpdateBookmarkColor(editingColorBm.id, null);
      showToast(`رنگ «${editingColorBm.title}» به حالت پیش‌فرض بازگشت.`);
    } else {
      const normalized = normalizeHex(trimmed);
      onUpdateBookmarkColor(editingColorBm.id, normalized);
      showToast(`رنگ «${editingColorBm.title}» تنظیم شد.`);
    }
    setEditingColorBm(null);
  }

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleOpenBookmark(bm, e) {
    if (!bm || !bm.url) return;
    const rawUrl = bm.url.trim();

    // Normalize URL with https:// if no scheme
    let finalUrl = rawUrl;
    if (!/^(https?:\/\/|about:|chrome:\/\/|edge:\/\/|file:\/\/\/|moz-extension:\/\/|ftp:\/\/)/i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const isInternalScheme = /^(about:|chrome:\/\/|edge:\/\/)/i.test(finalUrl);

    if (isInternalScheme) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      let opened = false;

      // 1. Python Site IP & Network Route Service on port 23159 (Launches URL natively via Firefox process)
      try {
        const res = await fetch(`http://127.0.0.1:23159/api/open-url?url=${encodeURIComponent(finalUrl)}`, {
          signal: AbortSignal.timeout(1500)
        });
        if (res.ok) opened = true;
      } catch (err) {}

      // 2. Windows Tools Agent on port 23157 fallback
      if (!opened) {
        try {
          const res = await fetch(`http://127.0.0.1:23157/api/open-url?url=${encodeURIComponent(finalUrl)}`, {
            signal: AbortSignal.timeout(1500)
          });
          if (res.ok) opened = true;
        } catch (err) {}
      }

      if (opened) {
        showToast(`در حال باز کردن «${finalUrl}» در تب جدید فایرفاکس...`);
        return;
      }

      // 3. Fallback: Copy to clipboard and instruct user
      if (navigator.clipboard) {
        navigator.clipboard.writeText(finalUrl).then(() => {
          showToast(`آدرس «${finalUrl}» در کلیپ‌بورد کپی شد. فایرفاکس به دلایل امنیتی لینک مستقیم به about: را مسدود می‌کند؛ لطفاً آن را در آدرس‌بار Paste کنید.`);
        }).catch(() => {});
      }
    } else {
      // Standard Web URL: Open in a clean new tab to prevent iframe X-Frame-Options embedding blocks (e.g. Bale, banks)
      window.open(finalUrl, '_blank');
    }
  }

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

  function handleDragStart(e, bm) {
    setDraggedId(bm.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bm.id);
  }

  function handleDragOver(e, bm) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId && draggedId !== bm.id && dragOverId !== bm.id) {
      setDragOverId(bm.id);
    }
  }

  function handleDragLeave(e, bm) {
    if (dragOverId === bm.id) {
      setDragOverId(null);
    }
  }

  function handleDrop(e, targetBm) {
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetBm.id) {
      setDraggedId(null);
      return;
    }

    // Reorder in bookmarks list
    const sourceIdx = bookmarks.findIndex((b) => b.id === draggedId);
    const targetIdx = bookmarks.findIndex((b) => b.id === targetBm.id);
    if (sourceIdx !== -1 && targetIdx !== -1) {
      const nextBookmarks = [...bookmarks];
      const [movedItem] = nextBookmarks.splice(sourceIdx, 1);
      nextBookmarks.splice(targetIdx, 0, movedItem);
      if (onReorderBookmarks) {
        onReorderBookmarks(nextBookmarks);
      }
    }
    setDraggedId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((bm) => {
          const defaultIcon = bm.url?.startsWith('about:') ? Wrench : (bm.isServer ? Server : Globe);
          const LucideComp = LUCIDE_ICONS[bm.iconValue] || LUCIDE_ICONS[bm.fallbackIcon] || defaultIcon || BookmarkIcon;
          const customBg = bm.customBgColor || null;

          const rawUrl = bm.url?.trim() || '';
          let finalUrl = rawUrl;
          if (!/^(https?:\/\/|about:|chrome:\/\/|edge:\/\/|file:\/\/\/|moz-extension:\/\/|ftp:\/\/)/i.test(finalUrl)) {
            finalUrl = 'https://' + finalUrl;
          }
          const isInternalScheme = /^(about:|chrome:\/\/|edge:\/\/)/i.test(finalUrl);

          const isDragging = draggedId === bm.id;
          const isOver = dragOverId === bm.id;

          return (
            <div
              key={bm.id}
              draggable
              onDragStart={(e) => handleDragStart(e, bm)}
              onDragOver={(e) => handleDragOver(e, bm)}
              onDragLeave={(e) => handleDragLeave(e, bm)}
              onDrop={(e) => handleDrop(e, bm)}
              onDragEnd={handleDragEnd}
              className={`relative transition-all duration-200 select-none ${
                isDragging ? 'opacity-30 scale-95' : 'opacity-100'
              } ${
                isOver ? 'ring-2 ring-[#38bdf8] scale-[1.02] shadow-xl shadow-[#38bdf8]/20' : ''
              }`}
            >
              <a
                href={isInternalScheme ? '#' : finalUrl}
                target={isInternalScheme ? '_self' : '_blank'}
                rel="noopener noreferrer"
                draggable={false}
                style={customBg ? { backgroundColor: customBg, '--card-bg': customBg, '--card-hover-bg': customBg } : {}}
                className="glass flex items-center p-3 rounded-xl gap-2.5 group relative cursor-pointer border border-[#ffffff]/10 hover:border-[#ffffff]/30 transition text-shadow no-underline block"
                onClick={(e) => {
                  if (isInternalScheme) {
                    e.preventDefault();
                    handleOpenBookmark(bm, e);
                  } else if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    window.open(finalUrl, '_blank');
                  }
                }}
                onAuxClick={(e) => {
                  if (e.button === 1 && isInternalScheme) {
                    e.preventDefault();
                    handleOpenBookmark(bm, e);
                  }
                }}
                title={bm.title}
              >
                {/* Drag Handle Indicator */}
                <div 
                  className="w-3.5 h-6 -mr-1 flex items-center justify-center opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing text-[#9ca3af] transition"
                  title="درگ برای جابه‌جایی"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Sticky Tooltip on Hover showing Full Name */}
                <div 
                  className="absolute -top-8 right-2 max-w-[240px] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 z-30 px-2.5 py-1 rounded-lg bg-black/95 text-white text-xs font-bold shadow-2xl border border-cyan-400/50 whitespace-nowrap overflow-hidden text-ellipsis text-right"
                >
                  {bm.title}
                </div>

                {/* Site Icon */}
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center pointer-events-none">
                  {bm.iconType === 'image' && bm.iconValue ? (
                    <img
                      src={bm.iconValue}
                      alt={bm.title}
                      className="site-icon w-6 h-6 object-contain pointer-events-none"
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

                {/* Title: Full width, displays complete title without truncation */}
                <span className="font-bold text-xs sm:text-sm text-white flex-1 leading-snug break-words pointer-events-none">
                  {bm.title}
                </span>

                {/* Hover Actions: Overlaid on the left side so title stretches to full width */}
                <div 
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-0.5 z-20 bg-black/85 backdrop-blur-md px-1 py-0.5 rounded-lg border border-white/15 shadow-xl"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {/* Logo Editor Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenLogoModal(bm);
                    }}
                    className="p-1.5 text-gray-300 hover:text-white hover:bg-black/50 rounded transition"
                    title="تغییر آیکون / لوگو"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>

                  {/* Color Picker button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenColorModal(bm);
                    }}
                    className="p-1.5 text-[#d1d5db] hover:text-[#ffffff] hover:bg-[#000000]/50 rounded transition"
                    title="تغییر رنگ پس‌زمینه"
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Pencil */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
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
                      e.preventDefault();
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
              </a>
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

      {/* Edit Background Color Modal */}
      {editingColorBm && (() => {
        const normalized = normalizeHex(hexColorInput);
        const valid = isValidColor(normalized);
        const displayColor = valid ? normalized : (editingColorBm.customBgColor || '#1e293b');
        const pickerColor = (valid && normalized.startsWith('#') && normalized.length >= 7)
          ? normalized.slice(0, 7)
          : (editingColorBm.customBgColor?.startsWith('#') && editingColorBm.customBgColor.length >= 7 ? editingColorBm.customBgColor.slice(0, 7) : '#1e293b');

        const defaultIcon = editingColorBm.url?.startsWith('about:') ? Wrench : (editingColorBm.isServer ? Server : Globe);
        const PreviewLucide = LUCIDE_ICONS[editingColorBm.iconValue] || LUCIDE_ICONS[editingColorBm.fallbackIcon] || defaultIcon || BookmarkIcon;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/75 backdrop-blur-sm"
            onClick={() => setEditingColorBm(null)}
          >
            <div 
              className="glass rounded-2xl p-5 w-full max-w-sm border border-[#ffffff]/20 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#ffffff]/10 mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffffff]">
                  <Palette className="w-4 h-4 text-[#38bdf8]" />
                  <span>تغییر رنگ پس‌زمینه</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingColorBm(null)}
                  className="p-1 text-[#9ca3af] hover:text-[#ffffff] rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveColor} className="space-y-4">
                {/* Live Preview Card */}
                <div>
                  <label className="block text-xs font-semibold text-[#d1d5db] mb-1.5">
                    پیش‌نمایش زنده بوکمارک:
                  </label>
                  <div 
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#ffffff]/25 shadow-lg transition-all"
                    style={{ backgroundColor: displayColor }}
                  >
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                      {editingColorBm.iconType === 'image' && editingColorBm.iconValue ? (
                        <img
                          src={editingColorBm.iconValue}
                          alt={editingColorBm.title}
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <PreviewLucide className="w-5 h-5 text-[#38bdf8]" />
                      )}
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-[#ffffff] flex-1 truncate">
                      {editingColorBm.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#ffffff]/90 bg-[#000000]/40 px-2 py-0.5 rounded border border-[#ffffff]/15">
                      {valid ? normalized : 'پیش‌فرض'}
                    </span>
                  </div>
                </div>

                {/* Hex Input and Native Picker */}
                <div>
                  <label className="block text-xs font-semibold text-[#d1d5db] mb-1.5">
                    کد هگز (Hex) یا انتخاب آزاد رنگ:
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Native Picker Swatch */}
                    <div 
                      className="relative w-11 h-9 rounded-xl border border-[#ffffff]/25 shadow-inner flex items-center justify-center cursor-pointer hover:border-[#38bdf8] transition overflow-hidden shrink-0 group"
                      style={{ backgroundColor: pickerColor }}
                      title="کلیک برای باز شدن جعبه رنگ ویندوز/مرورگر"
                    >
                      <input
                        type="color"
                        value={pickerColor}
                        onChange={(e) => setHexColorInput(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      <Palette className="w-4 h-4 text-[#ffffff] drop-shadow pointer-events-none group-hover:scale-110 transition" />
                    </div>

                    {/* Hex Code Text Input */}
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="#1e293b"
                      value={hexColorInput}
                      onChange={(e) => setHexColorInput(e.target.value)}
                      className="flex-1 bg-[#000000]/40 border border-[#ffffff]/15 rounded-xl px-3 py-2 text-xs text-[#ffffff] focus:outline-none focus:border-[#38bdf8] font-mono transition"
                    />
                  </div>
                  <p className="text-[10px] text-[#9ca3af] mt-1">
                    می‌توانید کد هگز مثل <span className="font-mono text-[#38bdf8]">#2563eb</span> را دستی تایپ کرده یا روی پالت کلیک کنید.
                  </p>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-xs font-semibold text-[#d1d5db] mb-1.5">
                    پالت رنگ‌های پیشنهادی:
                  </label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {PRESET_COLORS.map((preset) => {
                      const isSelected = normalized.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setHexColorInput(preset.hex)}
                          style={{ backgroundColor: preset.hex }}
                          className={`w-full h-7 rounded-lg border transition transform hover:scale-110 ${
                            isSelected
                              ? 'border-[#ffffff] ring-2 ring-[#38bdf8] scale-105'
                              : 'border-[#ffffff]/20 hover:border-[#ffffff]/60'
                          }`}
                          title={`${preset.name} (${preset.hex})`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-[#ffffff]/10">
                  {/* Reset to Default */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateBookmarkColor(editingColorBm.id, null);
                      showToast(`رنگ «${editingColorBm.title}» به حالت پیش‌فرض بازگشت.`);
                      setEditingColorBm(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#f87171] hover:bg-[#ef4444]/15 border border-[#ef4444]/30 transition flex items-center gap-1"
                    title="حذف رنگ اختصاصی و بازگشت به حالت شیشه‌ای شفاف"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    حذف رنگ
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingColorBm(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#d1d5db] hover:bg-[#ffffff]/10 transition"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] transition flex items-center gap-1 shadow-lg shadow-[#2563eb]/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      ثبت رنگ
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-slate-900/95 border border-cyan-500/40 text-cyan-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-medium backdrop-blur-md animate-fade-in flex items-center gap-2 max-w-md">
          <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
