import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Trash2, 
  Plus, 
  Search, 
  X, 
  Globe, 
  Monitor, 
  Layers, 
  Check, 
  Copy,
  RefreshCw
} from 'lucide-react';
import { fetchAutofillItems, saveAutofillItems } from '../services/windowsAgentService';

function purgeLegacyItems(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((it) => {
    if (!it) return false;
    const v = String(it.value || '').toLowerCase();
    const l = String(it.label || '').toLowerCase();
    if (v.includes('example.com') || v.includes('6037-9918') || l.includes('ایمیل کاری') || l.includes('ایمیل اصلی')) {
      return false;
    }
    return true;
  });
}

export default function AutofillManagerWidget() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('mqa_autofill_items');
      return saved ? purgeLegacyItems(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  // Tab State: 'browser' (default) vs 'desktop'
  const [activeTab, setActiveTab] = useState('browser');

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formLabel, setFormLabel] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formCategory, setFormCategory] = useState('عمومی');
  const [formDomain, setFormDomain] = useState('');
  const [formFieldId, setFormFieldId] = useState('');
  const [formTarget, setFormTarget] = useState('browser'); // 'browser' | 'desktop' | 'all'

  // Initial load from backend (agent port 23157)
  async function loadFromBackend() {
    setIsLoading(true);
    try {
      const backendItems = await fetchAutofillItems();
      if (backendItems !== null && Array.isArray(backendItems)) {
        const cleaned = purgeLegacyItems(backendItems);
        if (cleaned.length > 0 || items.length === 0) {
          setItems(cleaned);
          localStorage.setItem('mqa_autofill_items', JSON.stringify(cleaned));
        } else if (items.length > 0 && cleaned.length === 0) {
          await saveAutofillItems(items);
        }
      }
    } catch (err) {
      console.error('Failed to sync autofill with backend:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFromBackend();
  }, []);

  // Sync to both localStorage and central backend
  async function updateItems(newItems) {
    setItems(newItems);
    localStorage.setItem('mqa_autofill_items', JSON.stringify(newItems));
    await saveAutofillItems(newItems);
  }

  async function handleAddItem(e) {
    e.preventDefault();
    if (!formValue.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      label: formLabel.trim() || 'آیتم جدید',
      value: formValue.trim(),
      category: formCategory.trim() || 'عمومی',
      domain: formDomain.trim() || '',
      fieldId: formFieldId.trim() || '',
      target: formTarget || activeTab,
      createdAt: Date.now()
    };

    const nextItems = [newItem, ...items];
    await updateItems(nextItems);
    setIsAddModalOpen(false);

    // Reset Form
    setFormLabel('');
    setFormValue('');
    setFormCategory('عمومی');
    setFormDomain('');
    setFormFieldId('');
    setFormTarget(activeTab);
  }

  async function handleDeleteItem(id) {
    if (confirm('آیا از حذف این مورد از دیتابیس Autofill اطمینان دارید؟')) {
      const nextItems = items.filter((item) => item.id !== id);
      await updateItems(nextItems);
    }
  }

  function handleCopyValue(id, val) {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Filter items by Tab first, then by Search query
  const tabItems = items.filter((it) => {
    const t = it.target || (it.domain ? 'browser' : 'all');
    if (activeTab === 'browser') {
      return t === 'browser' || t === 'all' || Boolean(it.domain);
    } else {
      // desktop tab
      return t === 'desktop' || t === 'all' || !it.domain;
    }
  });

  const filteredItems = tabItems.filter((it) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      it.label?.toLowerCase().includes(q) ||
      it.value?.toLowerCase().includes(q) ||
      it.domain?.toLowerCase().includes(q) ||
      it.fieldId?.toLowerCase().includes(q) ||
      it.category?.toLowerCase().includes(q)
    );
  });

  const browserCount = items.filter((it) => {
    const t = it.target || (it.domain ? 'browser' : 'all');
    return t === 'browser' || t === 'all' || Boolean(it.domain);
  }).length;

  const desktopCount = items.filter((it) => {
    const t = it.target || (it.domain ? 'browser' : 'all');
    return t === 'desktop' || t === 'all' || !it.domain;
  }).length;

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">مدیریت Autofill یکپارچه</h3>
            <p className="text-[11px] text-slate-400">
              دیتابیس مشترک مرورگر و ویندوز ({items.length} مقدار کل)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFromBackend}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            title="همگام‌سازی با افزونه و ایجنت ویندوز"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              setFormTarget(activeTab);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن مقدار</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: مرورگر (پیش‌فرض) و دسکتاپ */}
      <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 mb-3">
        <button
          onClick={() => setActiveTab('browser')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'browser'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>مرورگر (پیش‌فرض)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'browser' ? 'bg-indigo-900/60 text-indigo-200' : 'bg-white/10 text-slate-400'
          }`}>
            {browserCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('desktop')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'desktop'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>دسکتاپ ویندوز (Alt+V)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeTab === 'desktop' ? 'bg-indigo-900/60 text-indigo-200' : 'bg-white/10 text-slate-400'
          }`}>
            {desktopCount}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute right-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder={activeTab === 'browser' ? 'جستجو در مقادیر، دامین‌ها و فیلدهای مرورگر...' : 'جستجو در کلیدها و مقادیر دسکتاپ...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-2xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-slate-400">
            {activeTab === 'browser' ? (
              <Globe className="w-10 h-10 text-slate-600 mb-2" />
            ) : (
              <Monitor className="w-10 h-10 text-slate-600 mb-2" />
            )}
            <p className="text-xs font-semibold text-white mb-1">
              {tabItems.length === 0
                ? activeTab === 'browser'
                  ? 'هنوز هیچ داده‌ای برای مرورگر ثبت نشده است'
                  : 'هنوز هیچ داده‌ای برای دسکتاپ ثبت نشده است'
                : 'موردی با این جستجو یافت نشد'}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              {activeTab === 'browser'
                ? 'با افزونه مرورگر روی فیلدها کلیک کنید یا با دکمه بالا مقدار جدید ثبت کنید.'
                : 'مقادیر دسکتاپ با کلید میانبر Alt+V در تمام برنامه‌های ویندوز در دسترس هستند.'}
            </p>
            {tabItems.length === 0 && (
              <button
                onClick={() => {
                  setFormTarget(activeTab);
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
              >
                افزودن اولین مقدار برای {activeTab === 'browser' ? 'مرورگر' : 'دسکتاپ'}
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl glass-subtle border border-white/5 hover:border-white/15 transition flex items-center justify-between gap-3 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-white truncate">
                    {item.label}
                  </span>
                  {item.category && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                      {item.category}
                    </span>
                  )}
                  {item.domain && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                      {item.domain}
                    </span>
                  )}
                  {(!item.target || item.target === 'all') && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      مشترک
                    </span>
                  )}
                </div>

                <div className="font-mono text-xs text-slate-200 truncate mt-0.5" dir="ltr" text-align="right">
                  {item.value}
                </div>

                {item.fieldId && (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" dir="ltr">
                    Field: {item.fieldId}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopyValue(item.id, item.value)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title="کپی مقدار در کلیپ‌بورد"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                  title="حذف مقدار"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span>نمایش {filteredItems.length} از {tabItems.length} مورد ({activeTab === 'browser' ? 'تب مرورگر' : 'تب دسکتاپ'})</span>
        <span className="font-mono text-[10px] text-indigo-400">
          {activeTab === 'browser' ? 'Web Extension Sync' : 'Windows Alt+V Palette'}
        </span>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white relative z-10"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">افزودن مقدار جدید به Autofill</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              {/* Target Selector */}
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  محیط هدف:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTarget('browser')}
                    className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                      formTarget === 'browser'
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    مرورگر
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTarget('desktop')}
                    className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                      formTarget === 'desktop'
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    دسکتاپ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTarget('all')}
                    className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                      formTarget === 'all'
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    مشترک (هر دو)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  عنوان آیتم:
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: ایمیل کاری، شماره کارت، کد ملی، توکن..."
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  مقدار فیلد (الزامی):
                </label>
                <input
                  type="text"
                  placeholder="متن، شماره یا کدی که باید پر شود"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">
                    دسته:
                  </label>
                  <input
                    type="text"
                    placeholder="عمومی، بانکی، هویتی..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">
                    دامین (مخصوص مرورگر):
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً divar.ir"
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {formTarget !== 'desktop' && (
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">
                    شناسه فیلد (اختیاری):
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً #national_id یا name=email"
                    value={formFieldId}
                    onChange={(e) => setFormFieldId(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                    dir="ltr"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
