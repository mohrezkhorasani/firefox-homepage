import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  HardDrive, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  PieChart, 
  BarChart3, 
  AlertTriangle, 
  ArrowUp, 
  Search, 
  FolderTree, 
  Sparkles,
  Info
} from 'lucide-react';
import { analyzeDriveFolder } from '../services/windowsAgentService';

export default function DriveAnalyzerModal({ isOpen, onClose, initialDrive, availableDrives = [] }) {
  const [currentPath, setCurrentPath] = useState(initialDrive ? `${initialDrive}\\` : 'C:\\');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'blocks'

  // Sync initial drive when opened
  useEffect(() => {
    if (isOpen) {
      const p = initialDrive ? (initialDrive.endsWith('\\') ? initialDrive : `${initialDrive}\\`) : 'C:\\';
      setCurrentPath(p);
      setHistory([]);
      loadAnalysis(p);
    }
  }, [isOpen, initialDrive]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  async function loadAnalysis(targetPath) {
    setLoading(true);
    setError(null);
    setSearchFilter('');
    try {
      const res = await analyzeDriveFolder(targetPath);
      if (res && res.ok) {
        setScanResult(res);
      } else {
        setError(res?.error || 'خطا در اسکن مسیر مورد نظر');
      }
    } catch (err) {
      setError(err.message || 'خطا در ارتباط با سرویس تحلیل دیسک پایتون');
    } finally {
      setLoading(false);
    }
  }

  function navigateToFolder(folderPath) {
    if (!folderPath) return;
    setHistory((prev) => [...prev, currentPath]);
    setCurrentPath(folderPath);
    loadAnalysis(folderPath);
  }

  function navigateBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((prevList) => prevList.slice(0, -1));
    setCurrentPath(prev);
    loadAnalysis(prev);
  }

  function navigateUp() {
    if (!currentPath || currentPath.length <= 3) return; // Root drive like C:\
    const normalized = currentPath.replace(/[\\/]+$/, '');
    const lastSlash = normalized.lastIndexOf('\\');
    if (lastSlash !== -1) {
      const parent = normalized.substring(0, lastSlash) + (lastSlash <= 2 ? '\\' : '');
      navigateToFolder(parent);
    }
  }

  if (!isOpen) return null;

  const items = scanResult?.items || [];
  const filteredItems = items.filter((it) => {
    if (!searchFilter.trim()) return true;
    return it.name.toLowerCase().includes(searchFilter.toLowerCase().trim());
  });

  // Calculate breadcrumbs
  const pathParts = currentPath.split('\\').filter(Boolean);

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-slate-950/95 backdrop-blur-xl animate-fade-in text-white overflow-hidden"
      dir="rtl"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              تحلیل فضای ذخیره‌سازی و درختی درایوها
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                Full-Page Tree Analyzer
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              شناسایی فولدرهای حجیم، سنگین‌ترین داده‌ها و ترافیک دیسک
            </p>
          </div>
        </div>

        {/* Drive Quick Selectors & Close Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
            {availableDrives.map((d) => {
              const driveKey = d.drive ? (d.drive.endsWith('\\') ? d.drive : `${d.drive}\\`) : d;
              const isSelected = currentPath.toUpperCase().startsWith(driveKey.toUpperCase().substring(0, 2));
              return (
                <button
                  key={d.drive || d}
                  onClick={() => {
                    setHistory([]);
                    setCurrentPath(driveKey);
                    loadAnalysis(driveKey);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{d.drive || d}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => loadAnalysis(currentPath)}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
            title="تحلیل و اسکن مجدد"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition"
            title="بستن پنجره (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation & Breadcrumb Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-black/30 border-b border-white/10 shrink-0 text-xs gap-3">
        {/* Navigation Buttons + Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={navigateBack}
            disabled={history.length === 0 || loading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition"
            title="بازگشت به مسیر قبلی"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={navigateUp}
            disabled={currentPath.length <= 3 || loading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition flex items-center gap-1 text-[11px]"
            title="پوشه والد (یک سطح بالاتر)"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بالاتر</span>
          </button>

          {/* Breadcrumb Path Display */}
          <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto scrollbar-none py-1 px-2.5 bg-slate-900/80 rounded-xl border border-white/10 text-slate-300 max-w-full" dir="ltr">
            <span className="text-indigo-400 font-bold shrink-0">{pathParts[0]}</span>
            {pathParts.slice(1).map((part, idx) => (
              <React.Fragment key={idx}>
                <span className="text-slate-600 shrink-0">\</span>
                <span className="text-slate-200 hover:text-indigo-300 transition cursor-pointer truncate max-w-[150px]">
                  {part}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right side: Search & Total Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="فیلتر نام پوشه / فایل..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-slate-900 border border-white/15 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 w-48 sm:w-60 transition"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {scanResult?.total_scanned_formatted && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs">
              <span className="text-slate-400">حجم محاسبه‌شده:</span>
              <strong className="text-indigo-300 font-mono font-bold">
                {scanResult.total_scanned_formatted}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-3">
            <div className="relative">
              <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin" />
              <FolderTree className="w-5 h-5 text-white absolute inset-0 m-auto" />
            </div>
            <p className="text-base font-semibold text-white">در حال تحلیل درختی و محاسبه حجم فولدرها...</p>
            <p className="text-xs text-slate-400 font-mono" dir="ltr">{currentPath}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">خطا در بارگذاری مسیر</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-md">{error}</p>
            <button
              onClick={() => loadAnalysis(currentPath)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              تلاش مجدد
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
            <Folder className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white mb-1">هیچ آیتمی یافت نشد</p>
            <p className="text-xs text-slate-500">پوشه خالی است یا با عبارت جستجو مطابقت ندارد.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-bold text-slate-400 border-b border-white/10 uppercase">
              <span className="col-span-6 sm:col-span-5">نام فولدر / فایل</span>
              <span className="col-span-2 text-center">حجم</span>
              <span className="col-span-4 sm:col-span-3 text-center">سهم از ترافیک دیسک</span>
              <span className="hidden sm:block col-span-2 text-left">تعداد فایل و زیرپوشه</span>
            </div>

            {/* List Rows */}
            {filteredItems.map((item) => {
              const isDir = item.is_dir;
              const percent = item.percent || 0;
              
              // Color graduation based on disk percentage
              let barColor = 'bg-indigo-500';
              let badgeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
              if (percent >= 30) {
                barColor = 'bg-rose-500';
                badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
              } else if (percent >= 15) {
                barColor = 'bg-amber-500';
                badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
              } else if (percent >= 5) {
                barColor = 'bg-cyan-500';
                badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
              }

              return (
                <div
                  key={item.path}
                  onClick={() => isDir && navigateToFolder(item.path)}
                  className={`grid grid-cols-12 gap-3 items-center p-3 rounded-2xl border border-white/5 transition group ${
                    isDir
                      ? 'cursor-pointer hover:border-indigo-500/40 hover:bg-white/5 bg-slate-900/40'
                      : 'bg-slate-900/20 opacity-80'
                  }`}
                >
                  {/* Name + Icon */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${isDir ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700/30 text-slate-400'}`}>
                      {isDir ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate" dir="ltr">
                        {item.path}
                      </div>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="col-span-2 text-center">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {item.size_formatted}
                    </span>
                    {item.is_partial && (
                      <span className="block text-[9px] text-amber-400" title="به علت عمق و حجم بالا تخمین زده شده است">
                        (تقریبی)
                      </span>
                    )}
                  </div>

                  {/* Percentage & Progress Bar */}
                  <div className="col-span-4 sm:col-span-3 flex flex-col gap-1 px-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">ترافیک:</span>
                      <span className={`font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10 p-0.2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(1, percent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Files & Subdirs Count */}
                  <div className="hidden sm:block col-span-2 text-left font-mono text-[11px] text-slate-400">
                    {isDir ? (
                      <span>{item.files_count.toLocaleString()} فایل | {item.subdirs_count.toLocaleString()} پوشه</span>
                    ) : (
                      <span className="text-slate-500">فایل مستقل</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Summary Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 bg-slate-900/80 shrink-0 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>
            نمایش <strong>{filteredItems.length}</strong> مورد در مسیر جاری. برای ورود به هر پوشه و مشاهده زیرشاخه‌ها روی آن کلیک کنید.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAnalysis(currentPath)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>اسکن و بروزرسانی این پوشه</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
