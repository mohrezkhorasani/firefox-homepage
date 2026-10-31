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
  AlertTriangle, 
  ArrowUp, 
  Search, 
  FolderTree, 
  Info,
  ChevronDown
} from 'lucide-react';
import { analyzeDriveFolder } from '../services/windowsAgentService';

export default function DriveAnalyzerModal({ isOpen, onClose, initialDrive, availableDrives = [] }) {
  const [currentPath, setCurrentPath] = useState(initialDrive ? `${initialDrive}\\` : 'C:\\');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  
  // Track expanded branch children: { [folderPath]: { loading: boolean, items: array, open: boolean } }
  const [expandedNodes, setExpandedNodes] = useState({});

  // Sync initial drive when opened
  useEffect(() => {
    if (isOpen) {
      const p = initialDrive ? (initialDrive.endsWith('\\') ? initialDrive : `${initialDrive}\\`) : 'C:\\';
      setCurrentPath(p);
      setHistory([]);
      setExpandedNodes({});
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

  function navigateToBreadcrumb(targetPath) {
    if (!targetPath || targetPath === currentPath) return;
    setHistory((prev) => [...prev, currentPath]);
    setCurrentPath(targetPath);
    loadAnalysis(targetPath);
  }

  function navigateBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((prevList) => prevList.slice(0, -1));
    setCurrentPath(prev);
    loadAnalysis(prev);
  }

  function navigateUp() {
    if (!currentPath || currentPath.length <= 3) return;
    const normalized = currentPath.replace(/[\\/]+$/, '');
    const lastSlash = normalized.lastIndexOf('\\');
    if (lastSlash !== -1) {
      const parent = normalized.substring(0, lastSlash) + (lastSlash <= 2 ? '\\' : '');
      navigateToFolder(parent);
    }
  }

  // Toggle inline branch expansion
  async function toggleBranchExpand(e, item) {
    e.stopPropagation();
    if (!item.is_dir) return;

    const p = item.path;
    const curr = expandedNodes[p];

    if (curr?.open) {
      setExpandedNodes((prev) => ({
        ...prev,
        [p]: { ...prev[p], open: false }
      }));
      return;
    }

    if (curr?.items) {
      setExpandedNodes((prev) => ({
        ...prev,
        [p]: { ...prev[p], open: true }
      }));
      return;
    }

    // Load sub-branch items
    setExpandedNodes((prev) => ({
      ...prev,
      [p]: { loading: true, items: [], open: true }
    }));

    try {
      const subRes = await analyzeDriveFolder(p);
      setExpandedNodes((prev) => ({
        ...prev,
        [p]: {
          loading: false,
          open: true,
          items: subRes.ok ? subRes.items : []
        }
      }));
    } catch {
      setExpandedNodes((prev) => ({
        ...prev,
        [p]: { loading: false, open: false, items: [] }
      }));
    }
  }

  if (!isOpen) return null;

  const items = scanResult?.items || [];
  const filteredItems = items.filter((it) => {
    if (!searchFilter.trim()) return true;
    return it.name.toLowerCase().includes(searchFilter.toLowerCase().trim());
  });

  // Calculate interactive breadcrumb segments with exact full paths
  const cleanPath = currentPath.replace(/[\\/]+$/, '');
  const segments = cleanPath.split('\\').filter(Boolean);
  const breadcrumbs = [];
  let accum = '';
  segments.forEach((seg, idx) => {
    accum = idx === 0 ? `${seg}\\` : `${accum}${seg}\\`;
    breadcrumbs.push({
      name: seg,
      fullPath: accum,
      isLast: idx === segments.length - 1
    });
  });

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-slate-950/95 backdrop-blur-2xl animate-fade-in text-white overflow-hidden"
      dir="rtl"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-slate-900/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              تحلیل درختی و شاخه‌ای دیسک
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 font-mono">
                Compact Branch Tree
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              مشاهده شاخه به شاخه پوشه‌های پرحجم با امکان گشت‌وگذار سریع در مسیرها
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <HardDrive className="w-3 h-3" />
                  <span>{d.drive || d}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => loadAnalysis(currentPath)}
            disabled={loading}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
            title="تحلیل مجدد شاخه فعلی"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition"
            title="بستن (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Breadcrumb Toolbar (شاخه به شاخه) */}
      <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-b border-white/10 shrink-0 text-xs gap-3">
        {/* Navigation History & Breadcrumb Chips */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={navigateBack}
            disabled={history.length === 0 || loading}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none text-slate-300 transition shrink-0"
            title="بازگشت به شاخه قبلی"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={navigateUp}
            disabled={currentPath.length <= 3 || loading}
            className="p-1 px-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none text-slate-300 transition shrink-0 flex items-center gap-1 text-[11px]"
            title="یک شاخه بالاتر"
          >
            <ArrowUp className="w-3 h-3" />
            <span className="hidden sm:inline">شاخه قبل</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-1 shrink-0" />

          {/* Interactive Breadcrumb Links */}
          <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto scrollbar-none" dir="ltr">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.fullPath}>
                {idx > 0 && <span className="text-slate-600 text-xs shrink-0">\</span>}
                <button
                  onClick={() => navigateToBreadcrumb(crumb.fullPath)}
                  disabled={crumb.isLast}
                  className={`px-2 py-0.5 rounded-lg text-xs transition shrink-0 flex items-center gap-1 ${
                    crumb.isLast
                      ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40 cursor-default'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 cursor-pointer'
                  }`}
                  title={`رفتن به شاخه ${crumb.fullPath}`}
                >
                  {idx === 0 ? <HardDrive className="w-3 h-3 text-indigo-400" /> : <Folder className="w-3 h-3 text-amber-400" />}
                  <span>{crumb.name}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Search & Scanned Total */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="w-3 h-3 absolute right-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در این شاخه..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl pr-7 pl-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 w-40 sm:w-52 transition"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute left-2 top-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {scanResult?.total_scanned_formatted && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-[11px]">
              <span className="text-slate-400">حجم این شاخه:</span>
              <strong className="text-indigo-300 font-mono font-bold">
                {scanResult.total_scanned_formatted}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Main Body: Compact Tree View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 gap-2.5">
            <RefreshCw className="w-9 h-9 text-indigo-400 animate-spin" />
            <p className="text-sm font-semibold text-white">در حال اسکن و محاسبه حجم شاخه‌ها...</p>
            <p className="text-xs text-slate-400 font-mono" dir="ltr">{currentPath}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
            <h3 className="text-sm font-bold text-white mb-1">خطا در بارگذاری مسیر</h3>
            <p className="text-xs text-slate-400 mb-3">{error}</p>
            <button
              onClick={() => loadAnalysis(currentPath)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              تلاش مجدد
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 text-slate-400">
            <Folder className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-white mb-1">این شاخه خالی است</p>
            <p className="text-[11px] text-slate-500">هیچ فایل یا پوشه‌ای در این شاخه یافت نشد.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Header Labels */}
            <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-white/5 uppercase">
              <span className="col-span-6 sm:col-span-5">شاخه / نام</span>
              <span className="col-span-2 text-center">حجم</span>
              <span className="col-span-4 sm:col-span-3 text-center">ترافیک شاخه</span>
              <span className="hidden sm:block col-span-2 text-left">عملیات / تعداد</span>
            </div>

            {/* Compact Branch Items */}
            {filteredItems.map((item) => {
              const isDir = item.is_dir;
              const percent = item.percent || 0;
              const nodeState = expandedNodes[item.path] || {};
              const isExpanded = nodeState.open;

              // Color graduation
              let barColor = 'bg-indigo-500';
              let badgeColor = 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20';
              if (percent >= 30) {
                barColor = 'bg-rose-500';
                badgeColor = 'text-rose-300 bg-rose-500/15 border-rose-500/30';
              } else if (percent >= 15) {
                barColor = 'bg-amber-500';
                badgeColor = 'text-amber-300 bg-amber-500/15 border-amber-500/30';
              } else if (percent >= 5) {
                barColor = 'bg-cyan-500';
                badgeColor = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20';
              }

              return (
                <div key={item.path} className="space-y-1">
                  {/* Branch Row */}
                  <div
                    onClick={() => isDir && navigateToFolder(item.path)}
                    className={`grid grid-cols-12 gap-2 items-center p-2 sm:px-3 rounded-xl border border-white/5 transition group select-none ${
                      isDir
                        ? 'cursor-pointer hover:border-indigo-500/30 hover:bg-white/5 bg-slate-900/50'
                        : 'bg-slate-900/20 opacity-75'
                    }`}
                  >
                    {/* Name + Toggle Icon */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-2 min-w-0">
                      {isDir ? (
                        <button
                          onClick={(e) => toggleBranchExpand(e, item)}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
                          title={isExpanded ? 'بستن زیرشاخه‌ها' : 'باز کردن سریع زیرشاخه‌ها'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <ChevronLeft className="w-3.5 h-3.5 group-hover:text-indigo-300" />
                          )}
                        </button>
                      ) : (
                        <div className="w-4 shrink-0" />
                      )}

                      <div className={`p-1.5 rounded-lg shrink-0 ${isDir ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700/30 text-slate-400'}`}>
                        {isDir ? <Folder className="w-3.5 h-3.5" /> : <File className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition truncate" title={item.name}>
                          {item.name}
                        </div>
                      </div>
                    </div>

                    {/* Size */}
                    <div className="col-span-2 text-center">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {item.size_formatted}
                      </span>
                      {item.is_partial && (
                        <span className="block text-[8px] text-amber-400 leading-tight" title="تخمینی به علت محدودیت عمق">
                          (تخمینی)
                        </span>
                      )}
                    </div>

                    {/* Percentage Progress Bar */}
                    <div className="col-span-4 sm:col-span-3 flex flex-col gap-0.5 px-1">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-slate-400">سهم:</span>
                        <span className={`font-mono font-bold px-1 rounded border ${badgeColor}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/10 p-0.2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${Math.min(100, Math.max(1, percent))}%` }}
                        />
                      </div>
                    </div>

                    {/* Action & Subdirs Count */}
                    <div className="hidden sm:flex col-span-2 items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{isDir ? `${item.files_count} فایل` : 'تک‌فایل'}</span>
                      {isDir && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToFolder(item.path);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 hover:text-white text-indigo-300 border border-indigo-500/30 transition text-[10px]"
                          title="ورود به این شاخه"
                        >
                          ورود &larr;
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-branch Inline Tree View (وقتی روی فلش کلیک می‌شود) */}
                  {isExpanded && (
                    <div className="mr-5 pr-3 border-r-2 border-indigo-500/30 space-y-1 py-1">
                      {nodeState.loading ? (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 py-1">
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                          <span>در حال دریافت شاخه‌های فرعی...</span>
                        </div>
                      ) : nodeState.items && nodeState.items.length > 0 ? (
                        nodeState.items.slice(0, 8).map((sub) => (
                          <div
                            key={sub.path}
                            onClick={() => sub.is_dir && navigateToFolder(sub.path)}
                            className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-slate-900/60 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/20 cursor-pointer text-xs transition"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {sub.is_dir ? (
                                <Folder className="w-3 h-3 text-amber-400/80 shrink-0" />
                              ) : (
                                <File className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate text-slate-200">{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                              <span className="text-slate-400">{sub.size_formatted}</span>
                              <span className="text-[9px] px-1 rounded bg-white/5 text-indigo-300 border border-white/10">
                                {sub.percent}%
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-slate-500 py-0.5">هیچ زیرشاخه‌ای موجود نیست.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-white/10 bg-slate-900/80 shrink-0 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            روی هر شاخه کلیک کنید تا وارد آن شوید؛ برای بازگشت به هر سطح، روی نام آن در <strong>نوار مسیر بالا (Breadcrumb)</strong> کلیک نمایید.
          </span>
        </div>

        <div className="font-mono text-[10px] text-indigo-400">
          Path: {cleanPath}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
