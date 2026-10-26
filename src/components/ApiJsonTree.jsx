import React, { useState } from 'react';
import { Check, Plus, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { extractSelectablePaths, formatParamValue } from '../services/apiMonitorService';

export default function ApiJsonTree({ data, selectedKeys = [], onToggleKey }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (data === null || data === undefined) {
    return <div className="text-gray-500 text-xs p-3">داده‌ای برای نمایش وجود ندارد.</div>;
  }

  const allPaths = extractSelectablePaths(data);

  const filteredPaths = allPaths.filter((item) =>
    item.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 bg-black/60 rounded-xl p-3 border border-white/10 select-none">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-gray-300">
          کلیدهای موجود در خروجی (کلیک برای انتخاب):
        </span>
        <div className="relative w-44">
          <Search className="w-3 h-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="فیلتر کلیدها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-6 pl-2 py-1 rounded bg-black/50 border border-white/15 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1" dir="ltr">
        {filteredPaths.length === 0 ? (
          <div className="text-[11px] text-gray-500 py-3 text-center">
            {searchTerm ? 'هیچ کلیدی مطابق با جستجو پیدا نشد.' : 'خروجی فاقد فیلد قابل انتخاب است.'}
          </div>
        ) : (
          filteredPaths.map((item) => {
            const isSelected = selectedKeys.includes(item.path);
            const valStr = formatParamValue(item.value);

            return (
              <div
                key={item.path}
                onClick={() => onToggleKey(item.path)}
                className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-200 shadow-sm'
                    : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/15'
                }`}
                title={`کلیک برای ${isSelected ? 'حذف' : 'افزودن'} به پارامترهای پایش`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 font-bold ${
                      isSelected
                        ? 'bg-cyan-500 text-black'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-2.5 h-2.5" />}
                  </div>
                  <span className="font-mono font-semibold truncate text-[11px] text-white">
                    {item.path}
                  </span>
                </div>

                <span
                  className="font-mono text-[10px] text-gray-400 truncate max-w-[150px] ml-2 text-right opacity-80"
                  dir="ltr"
                >
                  {valStr}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
