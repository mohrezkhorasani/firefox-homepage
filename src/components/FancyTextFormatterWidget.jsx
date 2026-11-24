import React, { useState, useEffect, useMemo } from 'react';
import { Type, Copy, Check, Sparkles, Trash2, History, FileText, CheckCircle2 } from 'lucide-react';

// Unicode Mathematical Sans-Serif Bold (A-Z, 0-9)
function toBoldSans(text) {
  if (!text) return '';
  const out = [];
  for (const c of text.toUpperCase()) {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) { // A-Z
      out.push(String.fromCodePoint(0x1D5D4 + (code - 65)));
    } else if (code >= 48 && code <= 57) { // 0-9
      out.push(String.fromCodePoint(0x1D7EC + (code - 48)));
    } else {
      out.push(c);
    }
  }
  return out.join('');
}

// Unicode Small Capitals Map
const SMALL_CAPS_MAP = {
  a: '\u1D00',
  b: '\u0299',
  c: '\u1D04',
  d: '\u1D05',
  e: '\u1D07',
  f: '\uA730',
  g: '\u0262',
  h: '\u029C',
  i: '\u026A',
  j: '\u1D0A',
  k: '\u1D0B',
  l: '\u029F',
  m: '\u1D0D',
  n: '\u0274',
  o: '\u1D0F',
  p: '\u1D18',
  q: '\u01EB',
  r: '\u0280',
  s: '\uA731',
  t: '\u1D1B',
  u: '\u1D1C',
  v: '\u1D20',
  w: '\u1D21',
  x: 'x',
  y: '\u028F',
  z: '\u1D22'
};

function toSmallCaps(text) {
  if (!text) return '';
  const out = [];
  for (const c of text) {
    const lower = c.toLowerCase();
    out.push(SMALL_CAPS_MAP[lower] || c);
  }
  return out.join('');
}

// Main conversion function
export function formatFancyText(prefix, suffix) {
  const p = (prefix || '').trim();
  const s = (suffix || '').trim();
  if (p && s) {
    return `${toBoldSans(p)} - ${toSmallCaps(s)}`;
  } else if (p) {
    return toBoldSans(p);
  } else if (s) {
    return toSmallCaps(s);
  }
  return '';
}

// Helper for converting single line containing '-'
export function convertLine(line) {
  if (!line || !line.trim()) return '';
  if (line.includes(' - ')) {
    const parts = line.split(' - ');
    return `${toBoldSans(parts[0].trim())} - ${toSmallCaps(parts.slice(1).join(' - ').trim())}`;
  } else if (line.includes('-')) {
    const parts = line.split('-');
    return `${toBoldSans(parts[0].trim())} - ${toSmallCaps(parts.slice(1).join('-').trim())}`;
  }
  return toBoldSans(line.trim());
}

const PRESET_PREFIXES = [
  'WORK',
  'STUDY',
  'PROJECT',
  'PERSONAL',
  'TASK',
  'NOTE',
  'IDEA',
  'WISH LIST',
  'CODE',
  'FINANCE',
  'READING',
  'GOAL',
  'LIFE',
  '__CUSTOM__'
];

export default function FancyTextFormatterWidget() {
  const [selectedPrefix, setSelectedPrefix] = useState('WORK');
  const [customPrefix, setCustomPrefix] = useState('');
  const [suffixText, setSuffixText] = useState('freelancer project');
  const [mode, setMode] = useState('dropdown'); // 'dropdown' | 'batch'
  const [batchText, setBatchText] = useState('work - freelancer project\nstudy - wish list\npersonal - daily workout');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  // History state
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_fancy_text_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [
      '𝗪𝗢𝗥𝗞 - ꜰʀᴇᴇʟᴀɴᴄᴇʀ ᴘʀᴏᴊᴇᴄᴛ',
      '𝗦𝗧𝗨𝗗𝗬 - ᴡɪꜱʜ ʟɪꜱᴛ'
    ];
  });

  useEffect(() => {
    localStorage.setItem('homepage_fancy_text_history', JSON.stringify(history.slice(0, 20)));
  }, [history]);

  const activePrefix = selectedPrefix === '__CUSTOM__' ? customPrefix : selectedPrefix;

  // Single line output
  const singleOutput = useMemo(() => {
    return formatFancyText(activePrefix, suffixText);
  }, [activePrefix, suffixText]);

  // Batch multi-line output
  const batchOutput = useMemo(() => {
    if (!batchText.trim()) return '';
    return batchText
      .split('\n')
      .map(line => convertLine(line))
      .join('\n');
  }, [batchText]);

  const currentResult = mode === 'dropdown' ? singleOutput : batchOutput;

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleCopy(textToCopy) {
    const text = textToCopy || currentResult;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('متن یونیکد در کلیپ‌بورد کپی شد');
      setTimeout(() => setCopied(false), 2000);

      // Add to history if single item and not duplicate
      if (mode === 'dropdown' && text && !history.includes(text)) {
        setHistory(prev => [text, ...prev.filter(item => item !== text)].slice(0, 20));
      }
    });
  }

  function handleQuickPaste(fullText) {
    if (!fullText) return;
    if (fullText.includes('-')) {
      const parts = fullText.split('-');
      const p = parts[0].trim().toUpperCase();
      const s = parts.slice(1).join('-').trim();
      if (PRESET_PREFIXES.includes(p)) {
        setSelectedPrefix(p);
      } else {
        setSelectedPrefix('__CUSTOM__');
        setCustomPrefix(p);
      }
      setSuffixText(s);
    } else {
      setSuffixText(fullText.trim());
    }
  }

  function handleDeleteHistoryItem(itemToDelete, e) {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item !== itemToDelete));
  }

  return (
    <div className="glass rounded-3xl p-6 border border-[#ffffff]/10 flex flex-col h-[520px] relative text-[#ffffff]" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-xl bg-[#0f172a]/95 text-[#f8fafc] border border-[#38bdf8]/40 shadow-xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ffffff]/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0284c7]/20 text-[#38bdf8] rounded-xl border border-[#0284c7]/30">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#ffffff] flex items-center gap-2">
              <span>استایلر متن و عنوان</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 font-mono">
                Bold & Small-Caps
              </span>
            </h3>
            <p className="text-[11px] text-[#94a3b8]">
              تبدیل فرمت تسک‌ها و پروژه‌ها (مانند: 𝗪𝗢𝗥𝗞 - ꜰʀᴇᴇʟᴀɴᴄᴇʀ ᴘʀᴏᴊᴇᴄᴛ)
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-[#0f172a]/80 p-0.5 rounded-xl border border-[#ffffff]/10 text-xs">
          <button
            onClick={() => setMode('dropdown')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              mode === 'dropdown' 
                ? 'bg-[#2563eb] text-[#ffffff] shadow-sm' 
                : 'text-[#94a3b8] hover:text-[#ffffff]'
            }`}
          >
            تک‌خطی (دراپ‌داون)
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              mode === 'batch' 
                ? 'bg-[#2563eb] text-[#ffffff] shadow-sm' 
                : 'text-[#94a3b8] hover:text-[#ffffff]'
            }`}
          >
            چندخطی (Batch)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 font-sans">
        {mode === 'dropdown' ? (
          <>
            {/* Input Row: Dropdown (Before -) & Text Input (After -) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#cbd5e1] flex items-center justify-between">
                <span>انتخاب دسته‌بندی و عنوان:</span>
                <span className="text-[10px] text-[#38bdf8] font-mono">قبل «-» دراپ‌داون است</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                {/* Prefix Dropdown (قبل -) */}
                <div className={selectedPrefix === '__CUSTOM__' ? 'sm:col-span-3' : 'sm:col-span-5'}>
                  <select
                    value={selectedPrefix}
                    onChange={(e) => setSelectedPrefix(e.target.value)}
                    className="w-full bg-[#0f172a] text-[#ffffff] border border-[#ffffff]/15 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#38bdf8] cursor-pointer shadow-sm"
                  >
                    <option value="WORK">💼 WORK (کار)</option>
                    <option value="STUDY">📚 STUDY (مطالعه)</option>
                    <option value="PROJECT">🚀 PROJECT (پروژه)</option>
                    <option value="PERSONAL">👤 PERSONAL (شخصی)</option>
                    <option value="TASK">✅ TASK (وظیفه)</option>
                    <option value="NOTE">📝 NOTE (یادداشت)</option>
                    <option value="IDEA">💡 IDEA (ایده)</option>
                    <option value="WISH LIST">⭐ WISH LIST (لیست آرزوها)</option>
                    <option value="CODE">💻 CODE (برنامه‌نویسی)</option>
                    <option value="FINANCE">💰 FINANCE (مالی)</option>
                    <option value="READING">📖 READING (کتاب)</option>
                    <option value="GOAL">🎯 GOAL (هدف)</option>
                    <option value="LIFE">🌱 LIFE (زندگی)</option>
                    <option value="__CUSTOM__">✏️ سفارشی (تایپ دلخواه...)</option>
                  </select>
                </div>

                {/* Custom prefix input if selected */}
                {selectedPrefix === '__CUSTOM__' && (
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="پیشوند دلخواه..."
                      value={customPrefix}
                      onChange={(e) => setCustomPrefix(e.target.value)}
                      className="w-full bg-[#020617] border border-[#38bdf8]/40 rounded-xl px-3 py-2 text-xs text-[#ffffff] placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8] font-mono"
                      autoFocus
                    />
                  </div>
                )}

                {/* Separator display */}
                <div className="hidden sm:flex items-center justify-center text-[#94a3b8] font-bold">
                  -
                </div>

                {/* Suffix Input (بعد -) */}
                <div className={selectedPrefix === '__CUSTOM__' ? 'sm:col-span-5' : 'sm:col-span-6'}>
                  <input
                    type="text"
                    placeholder="عنوان (مثلاً: freelancer project)..."
                    value={suffixText}
                    onChange={(e) => setSuffixText(e.target.value)}
                    className="w-full bg-[#020617] border border-[#ffffff]/15 rounded-xl px-3 py-2 text-xs text-[#ffffff] placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Quick full text parser helper */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#94a3b8]">
              <span>نمونه‌های آماده:</span>
              <button
                type="button"
                onClick={() => handleQuickPaste('work - freelancer project')}
                className="px-2 py-0.5 rounded-lg bg-[#ffffff]/5 hover:bg-[#ffffff]/15 text-[#38bdf8] transition font-mono"
              >
                work - freelancer project
              </button>
              <button
                type="button"
                onClick={() => handleQuickPaste('study - wish list')}
                className="px-2 py-0.5 rounded-lg bg-[#ffffff]/5 hover:bg-[#ffffff]/15 text-[#38bdf8] transition font-mono"
              >
                study - wish list
              </button>
            </div>
          </>
        ) : (
          /* Batch Multi-line Mode */
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#cbd5e1]">
              <span>متن چندخطی را وارد کنید (هر خط شامل <code className="text-[#38bdf8]">-</code>):</span>
              <button
                onClick={() => setBatchText('')}
                className="text-[11px] text-[#ef4444] hover:underline"
              >
                پاک کردن
              </button>
            </div>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="work - freelancer project&#10;study - wish list&#10;personal - morning workout"
              rows={4}
              className="w-full bg-[#020617] border border-[#ffffff]/15 rounded-2xl p-3 text-xs text-[#ffffff] placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8] font-mono leading-relaxed resize-none"
            />
          </div>
        )}

        {/* Live Formatted Result Box */}
        <div className="p-3.5 rounded-2xl bg-[#020617]/90 border border-[#38bdf8]/30 shadow-inner space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#38bdf8] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
              خروجی فرمت‌شده (آماده کپی):
            </span>
            <span className="text-[10px] text-[#94a3b8] font-mono">
              Unicode Sans Bold + Small-Caps
            </span>
          </div>

          <div
            onClick={() => handleCopy(currentResult)}
            className="p-3 bg-[#0f172a] rounded-xl border border-[#ffffff]/10 hover:border-[#38bdf8]/50 transition cursor-pointer group flex items-center justify-between gap-3"
            title="کلیک جهت کپی کردن"
          >
            <div className="font-mono text-sm sm:text-base font-semibold text-[#ffffff] break-all select-all leading-relaxed" dir="ltr">
              {currentResult || (
                <span className="text-[#64748b] text-xs">متن مورد نظر را وارد کنید...</span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(currentResult);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-[#ffffff] text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-md shadow-[#2563eb]/20"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  <span>کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent History / Quick Copy Badges */}
        {history.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-[#94a3b8]">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                <span>عناوین اخیر (کلیک جهت کپی سریع):</span>
              </span>
              <button
                onClick={() => setHistory([])}
                className="text-[10px] text-[#ef4444] hover:underline"
              >
                پاک کردن تاریخچه
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCopy(item)}
                  className="px-2.5 py-1 rounded-xl bg-[#0f172a]/80 hover:bg-[#1e293b] border border-[#ffffff]/10 text-xs font-mono text-[#cbd5e1] hover:text-[#ffffff] transition cursor-pointer flex items-center gap-1.5 group"
                  title="کلیک جهت کپی مجدد"
                >
                  <span dir="ltr">{item}</span>
                  <button
                    onClick={(e) => handleDeleteHistoryItem(item, e)}
                    className="opacity-0 group-hover:opacity-100 text-[#ef4444] hover:text-[#f87171] transition p-0.5"
                    title="حذف"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Tip */}
      <div className="pt-2.5 mt-2 border-t border-[#ffffff]/10 flex items-center justify-between text-[11px] text-[#94a3b8]">
        <span>حروف قبل خط تیره Bold Sans و حروف بعد Small Caps می‌شوند</span>
        <button
          onClick={() => handleCopy(currentResult)}
          className="text-[#38bdf8] hover:underline font-medium"
        >
          کپی خروجی فعلی
        </button>
      </div>
    </div>
  );
}
