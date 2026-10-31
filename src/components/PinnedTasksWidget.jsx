import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Play, Square, Plus, Search, X, Check, 
  Trash2, RefreshCw, AlertCircle, CheckCircle2, CheckSquare, 
  ToggleLeft, ToggleRight, CalendarClock, Terminal
} from 'lucide-react';
import { 
  fetchTasksList, 
  fetchTasksDetails, 
  controlTask 
} from '../services/windowsAgentService';

const DEFAULT_PINNED_TASKS = ['Mohrez - Windows Tools Agent'];

export default function PinnedTasksWidget() {
  const [pinnedNames, setPinnedNames] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_pinned_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PINNED_TASKS;
  });

  const [allTasks, setAllTasks] = useState([]);
  const [pinnedDetails, setPinnedDetails] = useState([]);
  const [isLoadingPinned, setIsLoadingPinned] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all, ready, running, disabled
  const [actionLoading, setActionLoading] = useState({}); // { [taskName]: 'run'|'end'|'enable'|'disable' }
  const [statusMessage, setStatusMessage] = useState(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('homepage_pinned_tasks', JSON.stringify(pinnedNames));
  }, [pinnedNames]);

  // Load pinned tasks details
  async function refreshPinnedDetails() {
    if (pinnedNames.length === 0) {
      setPinnedDetails([]);
      setIsLoadingPinned(false);
      return;
    }

    try {
      const details = await fetchTasksDetails(pinnedNames);
      setPinnedDetails((prev) => {
        return pinnedNames.map((name) => {
          const fetched = details.find((d) => 
            d.name?.toLowerCase() === name.toLowerCase() || 
            d.raw_name?.toLowerCase() === name.toLowerCase() ||
            d.raw_name?.toLowerCase() === `\\${name.toLowerCase()}`
          );
          const existing = prev.find((p) => p.name?.toLowerCase() === name.toLowerCase());
          return fetched || existing || {
            name,
            raw_name: name,
            status: 'Ready',
            state: 'Enabled',
            last_run: 'N/A',
            next_run: 'N/A',
            last_result: '0',
            exists: true
          };
        });
      });
    } catch (err) {
      console.error('Failed to load pinned tasks details:', err);
    } finally {
      setIsLoadingPinned(false);
    }
  }

  // Initial load and periodic poll
  useEffect(() => {
    refreshPinnedDetails();
    const interval = setInterval(refreshPinnedDetails, 15000);
    return () => clearInterval(interval);
  }, [pinnedNames]);

  // Load all tasks when modal opens
  async function openAddModal() {
    setIsModalOpen(true);
    setSearchQuery('');
    if (allTasks.length === 0) {
      setIsLoadingAll(true);
      try {
        const data = await fetchTasksList();
        setAllTasks(data.tasks || []);
      } catch (err) {
        console.error('Failed to fetch all tasks:', err);
      } finally {
        setIsLoadingAll(false);
      }
    }
  }

  async function handleAction(taskName, action) {
    setActionLoading((prev) => ({ ...prev, [taskName]: action }));
    setStatusMessage(null);
    try {
      const res = await controlTask(taskName, action);
      if (res.ok) {
        const actionLabels = {
          run: 'اجرا شد',
          end: 'متوقف گردید',
          enable: 'فعال شد',
          disable: 'غیرفعال شد'
        };
        setStatusMessage({ 
          type: 'success', 
          text: `تسک «${taskName}» با موفقیت ${actionLabels[action] || action}.` 
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || `خطا در اجرای عملیات ${action} روی تسک.` });
      }
      await refreshPinnedDetails();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در ارتباط با وب‌سرویس پایتون.' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [taskName]: null }));
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  function togglePin(taskName) {
    setPinnedNames((prev) => {
      const exists = prev.some((n) => n.toLowerCase() === taskName.toLowerCase());
      if (exists) {
        return prev.filter((n) => n.toLowerCase() !== taskName.toLowerCase());
      } else {
        return [...prev, taskName];
      }
    });
  }

  // Filtered tasks for search in modal
  const filteredTasks = useMemo(() => {
    let list = allTasks;
    if (filterTab === 'ready') {
      list = list.filter((t) => t.status?.toLowerCase() === 'ready');
    } else if (filterTab === 'running') {
      list = list.filter((t) => t.status?.toLowerCase() === 'running');
    } else if (filterTab === 'disabled') {
      list = list.filter((t) => t.status?.toLowerCase() === 'disabled');
    }

    if (!searchQuery.trim()) return list.slice(0, 80);

    const q = searchQuery.toLowerCase().trim();
    return list.filter((t) => 
      t.name?.toLowerCase().includes(q) || 
      (t.path && t.path.toLowerCase().includes(q))
    ).slice(0, 100);
  }, [allTasks, searchQuery, filterTab]);

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">تسک‌های زمان‌بندی‌شده (Task Scheduler)</h3>
            <p className="text-[11px] text-slate-400">
              {pinnedNames.length} تسک پین‌شده
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
            <RefreshCw className={`w-4 h-4 ${isLoadingPinned ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن تسک</span>
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

      {/* Pinned Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {isLoadingPinned && pinnedDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs">در حال بارگذاری تسک‌های پین‌شده...</span>
          </div>
        ) : pinnedDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-slate-400">
            <CalendarClock className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-white mb-1">هیچ تسکی پین نشده است</p>
            <p className="text-xs text-slate-400 mb-4">
              برای پایش، اجرای فوری یا فعال/غیرفعال کردن تسک‌های ویندوز، روی «افزودن تسک» کلیک کنید.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition"
            >
              انتخاب تسک‌ها
            </button>
          </div>
        ) : (
          pinnedDetails.map((task) => {
            const isRunning = task.status?.toLowerCase() === 'running';
            const isReady = task.status?.toLowerCase() === 'ready';
            const isDisabled = task.status?.toLowerCase() === 'disabled' || task.state === 'Disabled';
            const loading = actionLoading[task.name];

            return (
              <div
                key={task.name}
                className="p-3.5 rounded-2xl glass-subtle border border-white/5 hover:border-white/15 transition flex flex-col justify-between gap-2.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isRunning ? 'bg-emerald-400 animate-pulse' : isReady ? 'bg-cyan-400' : 'bg-slate-500'
                      }`} />
                      <h4 className="text-sm font-bold font-mono text-white truncate" title={task.name}>
                        {task.name}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isRunning 
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' 
                          : isReady
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                          : 'bg-slate-800 text-slate-400 border border-white/5'
                      }`}>
                        {isRunning ? 'در حال اجرا' : isReady ? 'آماده (Ready)' : isDisabled ? 'غیرفعال' : task.status}
                      </span>
                    </div>

                    {task.task_to_run && task.task_to_run !== 'N/A' && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono truncate" dir="ltr">
                        <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{task.task_to_run}</span>
                      </div>
                    )}
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isRunning ? (
                      <button
                        onClick={() => handleAction(task.name, 'end')}
                        disabled={!!loading}
                        className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition disabled:opacity-50"
                        title="توقف تسک (End)"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(task.name, 'run')}
                        disabled={!!loading || isDisabled}
                        className="p-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition disabled:opacity-50"
                        title="اجرای فوری تسک (Run Now)"
                      >
                        <Play className={`w-3.5 h-3.5 ${loading === 'run' ? 'animate-spin' : ''}`} />
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(task.name, isDisabled ? 'enable' : 'disable')}
                      disabled={!!loading}
                      className={`p-2 rounded-xl transition border ${
                        isDisabled 
                          ? 'bg-slate-800 text-slate-400 hover:text-emerald-300 border-white/10' 
                          : 'bg-white/5 text-slate-300 hover:text-amber-300 border-white/10'
                      }`}
                      title={isDisabled ? 'فعال کردن تسک' : 'غیرفعال کردن تسک'}
                    >
                      {isDisabled ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <button
                      onClick={() => togglePin(task.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="حذف از پین‌ها"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Task Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                  <div>
                    <span className="block text-[10px] text-slate-500">آخرین زمان اجرا:</span>
                    <span className="font-mono text-slate-200 truncate block">
                      {task.last_run || 'نامشخص'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500">زمان اجرای بعدی:</span>
                    <span className="font-mono text-slate-200 truncate block">
                      {task.next_run || 'N/A'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="block text-[10px] text-slate-500">نتیجه قبلی:</span>
                    <span className={`font-mono font-bold ${
                      task.last_result === '0' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {task.last_result === '0' ? 'موفق (Code 0)' : `کد ${task.last_result}`}
                    </span>
                  </div>
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
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">انتخاب و پین کردن تسک‌های ویندوز</h3>
                  <p className="text-xs text-slate-400">
                    جستجو در میان تسک‌های زمان‌بندی‌شده Task Scheduler و انتخاب موارد مهم
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
                  placeholder="جستجوی نام یا مسیر تسک (مثلاً Mohrez, Backup, Defrag, Update...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-2xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
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
                    { id: 'all', label: 'همه تسک‌ها' },
                    { id: 'ready', label: 'آماده (Ready)' },
                    { id: 'running', label: 'در حال اجرا' },
                    { id: 'disabled', label: 'غیرفعال' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl transition font-medium ${
                        filterTab === tab.id
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  {filteredTasks.length} مورد
                </span>
              </div>
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingAll ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="text-xs">در حال بارگذاری تسک‌های زمان‌بندی‌شده ویندوز...</span>
                </div>
              ) : filteredTasks.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-12">
                  تسکی با این مشخصات یافت نشد.
                </p>
              ) : (
                filteredTasks.map((task) => {
                  const isPinned = pinnedNames.some((n) => n.toLowerCase() === task.name.toLowerCase());
                  const isRunning = task.status?.toLowerCase() === 'running';
                  const isReady = task.status?.toLowerCase() === 'ready';

                  return (
                    <div
                      key={task.name}
                      onClick={() => togglePin(task.name)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isPinned
                          ? 'bg-cyan-950/40 border-cyan-500/40'
                          : 'glass-subtle border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            isRunning ? 'bg-emerald-400' : isReady ? 'bg-cyan-400' : 'bg-slate-500'
                          }`} />
                          <h4 className="text-sm font-bold font-mono text-white truncate">
                            {task.name}
                          </h4>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            isRunning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-400'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                          {task.full_path || task.path}
                        </p>
                      </div>

                      <div className={`p-2 rounded-xl flex items-center justify-center transition ${
                        isPinned
                          ? 'bg-cyan-600 text-white shadow-md'
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
                {pinnedNames.length} تسک انتخاب‌شده
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
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
