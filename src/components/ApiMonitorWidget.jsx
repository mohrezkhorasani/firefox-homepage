import React, { useState, useEffect, useCallback } from 'react';
import {
  Webhook,
  Plus,
  RotateCcw,
  Pin,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import ApiModal from './ApiModal';
import {
  DEFAULT_APIS,
  executeApiCall,
  getNestedValue,
  formatParamValue,
  getValueLightClass
} from '../services/apiMonitorService';

export default function ApiMonitorWidget() {
  const [apis, setApis] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_api_monitor_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved APIs:', e);
    }
    return DEFAULT_APIS;
  });

  const [apiResults, setApiResults] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState(null);
  const [isExtended, setIsExtended] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('homepage_api_monitor_v1', JSON.stringify(apis));
  }, [apis]);

  // Fetch a single API
  const fetchSingleApi = useCallback(async (api) => {
    setApiResults((prev) => ({
      ...prev,
      [api.id]: { ...(prev[api.id] || {}), loading: true }
    }));

    const result = await executeApiCall(api);

    setApiResults((prev) => ({
      ...prev,
      [api.id]: {
        ...result,
        loading: false,
        lastChecked: Date.now()
      }
    }));
  }, []);

  // Fetch all APIs in parallel
  const fetchAllApis = useCallback(async (targetList) => {
    const list = targetList || apis;
    if (!list || list.length === 0) return;

    setIsRefreshing(true);
    setApiResults((prev) => {
      const next = { ...prev };
      list.forEach((item) => {
        next[item.id] = { ...(next[item.id] || {}), loading: true };
      });
      return next;
    });

    await Promise.all(
      list.map(async (item) => {
        const res = await executeApiCall(item);
        setApiResults((prev) => ({
          ...prev,
          [item.id]: {
            ...res,
            loading: false,
            lastChecked: Date.now()
          }
        }));
      })
    );

    setIsRefreshing(false);
  }, [apis]);

  // Initial fetch on mount & periodic 60s refresh
  useEffect(() => {
    fetchAllApis(apis);
    const interval = setInterval(() => {
      fetchAllApis();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  function handleSaveApi(savedApi) {
    setApis((prev) => {
      const exists = prev.some((a) => a.id === savedApi.id);
      if (exists) {
        return prev.map((a) => (a.id === savedApi.id ? savedApi : a));
      }
      return [savedApi, ...prev];
    });

    fetchSingleApi(savedApi);
  }

  function handleDeleteApi(id) {
    setApis((prev) => prev.filter((a) => a.id !== id));
    setApiResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleTogglePin(id) {
    setApis((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return { ...a, pinned: !a.pinned };
      })
    );
  }

  function openAddModal() {
    setEditingApi(null);
    setIsModalOpen(true);
  }

  function openEditModal(api) {
    setEditingApi(api);
    setIsModalOpen(true);
  }

  // Filter pinned APIs (up to 3)
  const pinnedApis = apis.filter((a) => a.pinned).slice(0, 3);
  const displayPinned = pinnedApis.length > 0 ? pinnedApis : apis.slice(0, 3);

  return (
    <>
      <div
        className="fixed top-4 right-4 z-40 w-[320px] glass p-3 rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-2 select-none text-shadow animate-fadeIn"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Webhook className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>API ها</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
                {apis.length}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/30 text-[11px] font-bold transition shadow-sm"
              title="افزودن API جدید"
            >
              <Plus className="w-3 h-3" />
              <span>افزودن</span>
            </button>

            <button
              onClick={() => fetchAllApis()}
              disabled={isRefreshing}
              className={`p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition ${
                isRefreshing ? 'animate-spin text-cyan-400' : ''
              }`}
              title="بروزرسانی داده‌های API"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pinned APIs List (Compact View - Max 3) */}
        <div className="space-y-1.5">
          {displayPinned.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-500">
              هنوز هیچ API برای پایش ثبت نشده است.
            </div>
          ) : (
            displayPinned.map((api) => {
              const res = apiResults[api.id];
              const isLoading = res?.loading;
              const isOk = res?.ok;
              const selectedKeys = api.selectedKeys || [];

              // Status Indicator Light
              let reqDotClass = 'bg-amber-400 animate-pulse';
              let statusTooltip = 'در حال بررسی...';

              if (!isLoading && res !== undefined) {
                if (isOk) {
                  reqDotClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]';
                  statusTooltip = `موفق (${res.status} OK${res.time ? ` - ${res.time}ms` : ''})`;
                } else {
                  reqDotClass = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]';
                  statusTooltip = `خطا (${res.status || 'Connection Error'} - ${res.statusText || 'Failed'})`;
                }
              }

              return (
                <div
                  key={api.id}
                  className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 transition flex flex-col gap-1 group"
                >
                  {/* Top row: Status Light + Title + Quick Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 transition-colors ${reqDotClass}`}
                        title={statusTooltip}
                      />
                      <span className="text-xs font-bold text-gray-200 truncate">
                        {api.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      {res?.time && (
                        <span className="text-[9px] font-mono text-gray-400 mr-1" dir="ltr">
                          {res.time}ms
                        </span>
                      )}
                      <button
                        onClick={() => fetchSingleApi(api)}
                        disabled={isLoading}
                        className={`p-0.5 rounded text-gray-400 hover:text-white transition ${
                          isLoading ? 'animate-spin text-cyan-400' : ''
                        }`}
                        title="بروزرسانی این API"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(api)}
                        className="p-0.5 rounded text-gray-400 hover:text-cyan-300 transition"
                        title="ویرایش"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteApi(api.id)}
                        className="p-0.5 rounded text-gray-400 hover:text-rose-400 transition"
                        title="حذف این API"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Parameters Display Area: STACKED VERTICALLY (زیر هم) */}
                  {selectedKeys.length > 0 && res?.data && (
                    <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-white/5" dir="ltr">
                      {selectedKeys.map((keyPath) => {
                        const rawVal = getNestedValue(res.data, keyPath);
                        const valStr = formatParamValue(rawVal);
                        const lightClass = getValueLightClass(rawVal);
                        const isSingle = selectedKeys.length === 1;

                        return (
                          <div
                            key={keyPath}
                            className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/50 border border-white/5 text-[11px] font-mono"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {/* Value Status Indicator */}
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lightClass}`} />
                              {!isSingle && (
                                <span className="text-gray-400 font-medium truncate">
                                  {keyPath}:
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-cyan-200 truncate ml-2 text-right">
                              {valStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Error Message */}
                  {!isOk && !isLoading && res && (
                    <div className="text-[10px] text-rose-400 font-mono truncate px-1" dir="ltr">
                      {res.statusText || 'Connection Failed'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* View All / Extend Link */}
        {apis.length > 3 && (
          <button
            onClick={() => setIsExtended(!isExtended)}
            className="w-full flex items-center justify-between px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-cyan-300 hover:text-cyan-200 font-bold transition group"
          >
            <span>
              {isExtended ? 'بستن لیست کامل' : `مشاهده همه (${apis.length})`}
            </span>
            {isExtended ? (
              <ChevronUp className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
            ) : (
              <ChevronDown className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
            )}
          </button>
        )}

        {/* Accordion / Extended List (Expands downward, NO modal) */}
        {isExtended && (
          <div className="p-1 space-y-1.5 max-h-60 overflow-y-auto border-t border-white/10 pt-2 custom-scrollbar animate-fadeIn">
            {apis.map((api) => {
              const res = apiResults[api.id];
              const isOk = res?.ok;
              const isLoading = res?.loading;
              const dotClass = isLoading
                ? 'bg-amber-400 animate-pulse'
                : isOk
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]';

              return (
                <div
                  key={api.id}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-200 truncate">
                          {api.title}
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-gray-400">
                          {api.method}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 truncate" dir="ltr">
                        {api.url}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePin(api.id)}
                      className={`p-1 rounded transition ${
                        api.pinned
                          ? 'text-amber-400 bg-amber-400/15'
                          : 'text-gray-500 hover:text-gray-200 hover:bg-white/10'
                      }`}
                      title={api.pinned ? 'حذف پین' : 'پین'}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openEditModal(api)}
                      className="p-1 rounded text-gray-400 hover:text-cyan-300 hover:bg-white/10 transition"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteApi(api.id)}
                      className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit API Modal */}
      <ApiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveApi}
        editingApi={editingApi}
      />
    </>
  );
}
