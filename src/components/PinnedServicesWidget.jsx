import React, { useState, useEffect, useMemo } from 'react';
import { 
  Server, Play, Square, RotateCw, Plus, Search, X, Check, 
  Trash2, RefreshCw, AlertCircle, CheckCircle2, Shield, Activity
} from 'lucide-react';
import { 
  fetchServicesList, 
  fetchServicesDetails, 
  controlService 
} from '../services/windowsAgentService';

const DEFAULT_PINNED_SERVICES = ['AnyDesk', 'WinDefend', 'W32Time', 'WSearch'];

export default function PinnedServicesWidget() {
  const [pinnedNames, setPinnedNames] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_pinned_services');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PINNED_SERVICES;
  });

  const [allServices, setAllServices] = useState([]);
  const [pinnedDetails, setPinnedDetails] = useState([]);
  const [isLoadingPinned, setIsLoadingPinned] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all, running, stopped
  const [actionLoading, setActionLoading] = useState({}); // { [svcName]: 'start'|'stop'|'restart' }
  const [statusMessage, setStatusMessage] = useState(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('homepage_pinned_services', JSON.stringify(pinnedNames));
  }, [pinnedNames]);

  // Load pinned services details
  async function refreshPinnedDetails() {
    if (pinnedNames.length === 0) {
      setPinnedDetails([]);
      setIsLoadingPinned(false);
      return;
    }

    try {
      const details = await fetchServicesDetails(pinnedNames);
      // Merge with any cached display names if available
      setPinnedDetails((prev) => {
        return pinnedNames.map((name) => {
          const fetched = details.find((d) => d.name.toLowerCase() === name.toLowerCase());
          const existing = prev.find((p) => p.name.toLowerCase() === name.toLowerCase());
          const fromAll = allServices.find((a) => a.name.toLowerCase() === name.toLowerCase());
          return {
            name,
            display_name: fromAll?.display_name || existing?.display_name || name,
            start_type: fromAll?.start_type || existing?.start_type || 'Manual',
            status: fetched?.status || existing?.status || 'Unknown',
            exists: fetched ? fetched.exists : true
          };
        });
      });
    } catch (err) {
      console.error('Failed to load pinned services details:', err);
    } finally {
      setIsLoadingPinned(false);
    }
  }

  // Initial load on mount or when pinned list changes (no auto-poll, user clicks refresh button)
  useEffect(() => {
    refreshPinnedDetails();
  }, [pinnedNames]);

  // Load all services when modal opens
  async function openAddModal() {
    setIsModalOpen(true);
    setSearchQuery('');
    if (allServices.length === 0) {
      setIsLoadingAll(true);
      try {
        const data = await fetchServicesList();
        setAllServices(data.services || []);
      } catch (err) {
        console.error('Failed to fetch all services:', err);
      } finally {
        setIsLoadingAll(false);
      }
    }
  }

  async function handleAction(serviceName, action) {
    setActionLoading((prev) => ({ ...prev, [serviceName]: action }));
    setStatusMessage(null);
    try {
      const res = await controlService(serviceName, action);
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `سرویس ${serviceName} با موفقیت ${action === 'start' ? 'روشن' : action === 'stop' ? 'متوقف' : 'راه‌اندازی مجدد'} شد.` });
      } else {
        setStatusMessage({ type: 'error', text: res.error || `خطا در اجرای عملیات ${action} روی سرویس.` });
      }
      await refreshPinnedDetails();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در ارتباط با وب‌سرویس پایتون.' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [serviceName]: null }));
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  function togglePin(serviceName) {
    setPinnedNames((prev) => {
      const exists = prev.some((n) => n.toLowerCase() === serviceName.toLowerCase());
      if (exists) {
        return prev.filter((n) => n.toLowerCase() !== serviceName.toLowerCase());
      } else {
        return [...prev, serviceName];
      }
    });
  }

  // Filtered services for the modal search
  const filteredServices = useMemo(() => {
    let list = allServices;
    if (filterTab === 'running') {
      list = list.filter((s) => s.status === 'Running');
    } else if (filterTab === 'stopped') {
      list = list.filter((s) => s.status === 'Stopped');
    }

    if (!searchQuery.trim()) return list.slice(0, 80);

    const q = searchQuery.toLowerCase().trim();
    return list.filter((s) => 
      s.name.toLowerCase().includes(q) || 
      (s.display_name && s.display_name.toLowerCase().includes(q))
    ).slice(0, 100);
  }, [allServices, searchQuery, filterTab]);

  const runningCount = pinnedDetails.filter((s) => s.status === 'Running').length;

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">سرویس‌های ویندوز (Windows Services)</h3>
            <p className="text-[11px] text-slate-400">
              {pinnedNames.length} سرویس پین‌شده ({runningCount} فعال)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLoadingPinned(true);
              refreshPinnedDetails();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            title="به‌روزرسانی وضعیت"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingPinned ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن سرویس</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className={`p-2.5 rounded-xl mb-3 text-xs flex items-center gap-2 transition ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Pinned Services List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {isLoadingPinned && pinnedDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs">در حال بارگذاری سرویس‌های پین‌شده...</span>
          </div>
        ) : pinnedDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-slate-400">
            <Server className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white mb-1">هیچ سرویسی پین نشده است</p>
            <p className="text-xs text-slate-400 mb-4">
              برای پایش، روشن و خاموش کردن سرویس‌های مهم ویندوز، روی «افزودن سرویس» کلیک کنید.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
            >
              انتخاب سرویس‌ها
            </button>
          </div>
        ) : (
          pinnedDetails.map((svc) => {
            const isRunning = svc.status === 'Running';
            const isStopped = svc.status === 'Stopped';
            const loading = actionLoading[svc.name];

            return (
              <div
                key={svc.name}
                className="p-3.5 rounded-2xl glass-subtle border border-white/5 hover:border-white/15 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Service info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`} />
                    <h4 className="text-sm font-bold font-mono text-white truncate" title={svc.name}>
                      {svc.name}
                    </h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isRunning 
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' 
                        : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}>
                      {isRunning ? 'در حال اجرا' : isStopped ? 'متوقف' : svc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 truncate" title={svc.display_name}>
                    {svc.display_name}
                  </p>
                  
                  {svc.start_type && (
                    <span className="text-[10px] text-slate-400 font-mono mt-1 inline-block">
                      نوع اجرا: {svc.start_type === 'Automatic' ? 'خودکار' : svc.start_type === 'Manual' ? 'دستی' : svc.start_type}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {isRunning ? (
                    <>
                      <button
                        onClick={() => handleAction(svc.name, 'restart')}
                        disabled={!!loading}
                        className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition disabled:opacity-50"
                        title="راه‌اندازی مجدد (Restart)"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${loading === 'restart' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleAction(svc.name, 'stop')}
                        disabled={!!loading}
                        className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition disabled:opacity-50"
                        title="توقف سرویس (Stop)"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAction(svc.name, 'start')}
                      disabled={!!loading}
                      className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-50"
                      title="شروع به کار سرویس (Start)"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => togglePin(svc.name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="حذف از پین‌ها"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Search Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-2xl p-6 shadow-2xl text-white flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">انتخاب و پین کردن سرویس‌های ویندوز</h3>
                  <p className="text-xs text-slate-400">
                    جستجو در میان تمام سرویس‌های ویندوز و انتخاب موارد دلخواه
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input & Filter Tabs */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجوی نام یا توضیح سرویس (مثلاً AnyDesk, Update, Defender, Audio...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-2xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-400 transition"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-3 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 text-xs">
                  {[
                    { id: 'all', label: 'همه سرویس‌ها' },
                    { id: 'running', label: 'در حال اجرا' },
                    { id: 'stopped', label: 'متوقف‌شده' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl transition font-medium ${
                        filterTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  {filteredServices.length} مورد
                </span>
              </div>
            </div>

            {/* Services List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingAll ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                  <span className="text-xs">در حال واکشی لیست سرویس‌های ویندوز...</span>
                </div>
              ) : filteredServices.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-12">
                  سرویسی با این مشخصات یافت نشد.
                </p>
              ) : (
                filteredServices.map((svc) => {
                  const isPinned = pinnedNames.some((n) => n.toLowerCase() === svc.name.toLowerCase());
                  const isRunning = svc.status === 'Running';

                  return (
                    <div
                      key={svc.name}
                      onClick={() => togglePin(svc.name)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isPinned
                          ? 'bg-indigo-950/40 border-indigo-500/40'
                          : 'glass-subtle border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            isRunning ? 'bg-emerald-400' : 'bg-slate-500'
                          }`} />
                          <h4 className="text-sm font-bold font-mono text-white truncate">
                            {svc.name}
                          </h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            isRunning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400'
                          }`}>
                            {isRunning ? 'Running' : 'Stopped'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate">
                          {svc.display_name}
                        </p>
                      </div>

                      <div className={`p-2 rounded-xl flex items-center justify-center transition ${
                        isPinned
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}>
                        {isPinned ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {pinnedNames.length} سرویس انتخاب‌شده
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
              >
                بستن و ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
