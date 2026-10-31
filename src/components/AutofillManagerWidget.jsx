import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Search, 
  X, 
  Globe, 
  Tag, 
  Key, 
  Sparkles, 
  Check, 
  Copy,
  RefreshCw
} from 'lucide-react';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formLabel, setFormLabel] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formCategory, setFormCategory] = useState('عمومی');
  const [formDomain, setFormDomain] = useState('');
  const [formFieldId, setFormFieldId] = useState('');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('mqa_autofill_items', JSON.stringify(items));
  }, [items]);

  function handleAddItem(e) {
    e.preventDefault();
    if (!formValue.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      label: formLabel.trim() || 'آیتم جدید',
      value: formValue.trim(),
      category: formCategory.trim() || 'عمومی',
      domain: formDomain.trim() || '',
      fieldId: formFieldId.trim() || '',
      createdAt: Date.now()
    };

    setItems([newItem, ...items]);
    setIsAddModalOpen(false);

    // Reset Form
    setFormLabel('');
    setFormValue('');
    setFormCategory('عمومی');
    setFormDomain('');
    setFormFieldId('');
  }

  function handleDeleteItem(id) {
    if (confirm('آیا از حذف این مورد از دیتابیس Autofill اطمینان دارید؟')) {
      setItems(items.filter((item) => item.id !== id));
    }
  }

  function handleCopyValue(id, val) {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredItems = items.filter((it) => {
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

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">مدیریت Autofill مرورگر</h3>
            <p className="text-[11px] text-slate-400">
              {items.length} مقدار ذخیره‌شده (دامین‌ها و فیلدها)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>افزودن مقدار</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute right-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="جستجو در مقادیر، دامین‌ها، فیلدها..."
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
            <Zap className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-white mb-1">
              {items.length === 0 ? 'هنوز هیچ داده‌ای ثبت نشده است' : 'موردی با این جستجو یافت نشد'}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              با اکستنشن مرورگر یا دکمه افزودن بالا، مقادیر و دامین‌ها را ذخیره کنید.
            </p>
            {items.length === 0 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
              >
                افزودن اولین مقدار
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
        <span>نمایش {filteredItems.length} از {items.length} مورد</span>
        <span className="font-mono text-[10px] text-indigo-400">Mohrez Quick Autofill</span>
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
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  عنوان آیتم:
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: ایمیل کاری، شماره کارت، کد ملی..."
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
                    دامین (اختیاری):
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
