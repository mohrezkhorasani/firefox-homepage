import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  X, 
  Check, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Power,
  SlidersHorizontal,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  fetchFirewallRules, 
  fetchFirewallRulesDetails, 
  toggleFirewallRule 
} from '../services/windowsAgentService';

const DEFAULT_PINNED_RULES = [
  '5036 dotnet vs',
  '7087 dotnet vs',
  'Remote Desktop - User Mode (TCP-In)',
  'Network Discovery (UPnP-Out)'
];

export default function PinnedFirewallWidget() {
  const [pinnedNames, setPinnedNames] = useState(() => {
    const saved = localStorage.getItem('homepage_pinned_firewall_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_PINNED_RULES;
  });

  const [pinnedDetails, setPinnedDetails] = useState([]);
  const [isLoadingPinned, setIsLoadingPinned] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allRules, setAllRules] = useState([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, open_ports, inbound, outbound

  // Save pinned names to localStorage
  useEffect(() => {
    localStorage.setItem('homepage_pinned_firewall_v1', JSON.stringify(pinnedNames));
  }, [pinnedNames]);

  // Load details of pinned rules
  async function refreshPinnedDetails() {
    if (pinnedNames.length === 0) {
      setPinnedDetails([]);
      return;
    }
    setIsLoadingPinned(true);
    try {
      const details = await fetchFirewallRulesDetails(pinnedNames);
      setPinnedDetails((prev) => {
        return pinnedNames.map((name) => {
          const fetched = details.find((d) => d.name?.toLowerCase() === name.toLowerCase());
          const existing = prev.find((p) => p.name?.toLowerCase() === name.toLowerCase());
          const fromAll = allRules.find((a) => a.name?.toLowerCase() === name.toLowerCase());
          return {
            name,
            enabled: fetched ? fetched.enabled : (existing?.enabled ?? fromAll?.enabled ?? true),
            direction: fetched?.direction || existing?.direction || fromAll?.direction || 'In',
            action: fetched?.action || existing?.action || fromAll?.action || 'Allow',
            protocol: fetched?.protocol || existing?.protocol || fromAll?.protocol || 'TCP',
            port: fetched?.port || existing?.port || fromAll?.port || 'Any',
            program: fetched?.program || existing?.program || fromAll?.program || 'Any',
            is_open_port: fetched ? fetched.is_open_port : (existing?.is_open_port ?? fromAll?.is_open_port ?? false),
            exists: fetched ? fetched.exists : true
          };
        });
      });
    } catch (err) {
      console.error('Failed to load pinned firewall details:', err);
    } finally {
      setIsLoadingPinned(false);
    }
  }

  // Load on mount or when pinned list changes (manual refresh via button)
  useEffect(() => {
    refreshPinnedDetails();
  }, [pinnedNames]);

  // Open Add/Search modal
  async function openAddModal() {
    setIsModalOpen(true);
    setSearchQuery('');
    if (allRules.length === 0) {
      setIsLoadingAll(true);
      try {
        const data = await fetchFirewallRules();
        setAllRules(data.rules || []);
      } catch (err) {
        console.error('Failed to fetch all firewall rules:', err);
      } finally {
        setIsLoadingAll(false);
      }
    }
  }

  // Toggle rule enable/disable
  async function handleToggleRule(ruleName, currentEnabled) {
    const action = currentEnabled ? 'disable' : 'enable';
    setActionLoading((prev) => ({ ...prev, [ruleName]: true }));
    setStatusMessage(null);
    try {
      const res = await toggleFirewallRule(ruleName, action);
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `رول «${ruleName}» با موفقیت ${action === 'enable' ? 'فعال (Enable)' : 'غیرفعال (Disable)'} شد.`
        });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'خطا در تغییر وضعیت رول فایروال.' });
      }
      await refreshPinnedDetails();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'خطا در برقراری ارتباط با پایتون.' });
    } finally {
      setActionLoading((prev) => ({ ...prev, [ruleName]: false }));
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }

  function handleTogglePin(ruleName) {
    setPinnedNames((prev) => {
      const exists = prev.some((n) => n.toLowerCase() === ruleName.toLowerCase());
      if (exists) {
        return prev.filter((n) => n.toLowerCase() !== ruleName.toLowerCase());
      } else {
        return [...prev, ruleName];
      }
    });
  }

  function handleRemovePinned(ruleName) {
    setPinnedNames((prev) => prev.filter((n) => n.toLowerCase() !== ruleName.toLowerCase()));
  }

  // Filtered catalog in modal
  const filteredRules = useMemo(() => {
    let list = allRules;
    if (filterType === 'open_ports') {
      list = list.filter((r) => r.is_open_port);
    } else if (filterType === 'inbound') {
      list = list.filter((r) => r.direction === 'In');
    } else if (filterType === 'outbound') {
      list = list.filter((r) => r.direction === 'Out');
    }

    if (!searchQuery.trim()) return list.slice(0, 100);

    const q = searchQuery.toLowerCase().trim();
    return list.filter((r) => 
      r.name?.toLowerCase().includes(q) ||
      r.port?.toLowerCase().includes(q) ||
      r.protocol?.toLowerCase().includes(q) ||
      r.program?.toLowerCase().includes(q)
    ).slice(0, 120);
  }, [allRules, searchQuery, filterType]);

  const enabledCount = pinnedDetails.filter((r) => r.enabled).length;

  const modalNode = isModalOpen && (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[85vh] relative z-10"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">انتخاب و پین کردن رول‌های فایروال ویندوز</h3>
              <p className="text-xs text-slate-400">
                پورت‌های باز (Open Ports)، رول‌های ورودی (Inbound) و خروجی (Outbound)
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

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در نام رول، شماره پورت، پروتکل (مثلاً 5036, Remote Desktop, TCP, Any...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/15 rounded-2xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
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

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 rounded-xl font-medium transition shrink-0 ${
                filterType === 'all' ? 'bg-emerald-600 text-white shadow' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              همه ({allRules.length})
            </button>
            <button
              onClick={() => setFilterType('open_ports')}
              className={`px-3 py-2 rounded-xl font-medium transition shrink-0 ${
                filterType === 'open_ports' ? 'bg-emerald-600 text-white shadow' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              پورت‌های باز
            </button>
            <button
              onClick={() => setFilterType('inbound')}
              className={`px-3 py-2 rounded-xl font-medium transition shrink-0 ${
                filterType === 'inbound' ? 'bg-emerald-600 text-white shadow' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              ورودی (In)
            </button>
            <button
              onClick={() => setFilterType('outbound')}
              className={`px-3 py-2 rounded-xl font-medium transition shrink-0 ${
                filterType === 'outbound' ? 'bg-emerald-600 text-white shadow' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              خروجی (Out)
            </button>
          </div>
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoadingAll ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs">در حال دریافت قوانین فایروال ویندوز...</span>
            </div>
          ) : filteredRules.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-12">
              قانونی با این مشخصات یافت نشد.
            </p>
          ) : (
            filteredRules.map((rule, idx) => {
              const isPinned = pinnedNames.some((n) => n.toLowerCase() === rule.name.toLowerCase());

              return (
                <div
                  key={`${rule.name}-${idx}`}
                  onClick={() => handleTogglePin(rule.name)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isPinned
                      ? 'bg-emerald-950/40 border-emerald-500/50'
                      : 'glass-subtle border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 border ${
                      rule.enabled 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' 
                        : 'bg-slate-800 text-slate-500 border-white/5'
                    }`}>
                      {rule.enabled ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-white truncate" title={rule.name}>
                          {rule.name}
                        </span>
                        {rule.is_open_port && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                            پورت باز
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>پورت: {rule.port}</span>
                        <span>•</span>
                        <span>پروتکل: {rule.protocol}</span>
                        <span>•</span>
                        <span>جهت: {rule.direction === 'In' ? 'ورودی (In)' : 'خروجی (Out)'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
                    isPinned ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-emerald-600 hover:text-white'
                  }`}>
                    {isPinned ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>پین‌شده</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>پین کردن</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>نمایش {filteredRules.length} قانون فایروال</span>
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition"
          >
            تأیید و بستن
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[560px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">فایروال ویندوز و پورت‌های باز</h3>
              <p className="text-[11px] text-slate-400">
                {pinnedNames.length} رول پین‌شده ({enabledCount} فعال)
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
              <RefreshCw className={`w-4 h-4 ${isLoadingPinned ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن رول</span>
            </button>
          </div>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className={`p-2.5 rounded-xl mb-3 text-xs flex items-center gap-2 transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Pinned Rules List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {isLoadingPinned && pinnedDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs">در حال بارگذاری قوانین فایروال پین‌شده...</span>
            </div>
          ) : pinnedDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 text-slate-400">
              <ShieldCheck className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-white mb-1">هیچ رولی از فایروال پین نشده است</p>
              <p className="text-xs text-slate-400 mb-4">
                برای مدیریت پورت‌های باز و روشن/خاموش کردن قوانین فایروال روی «افزودن رول» کلیک کنید.
              </p>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
              >
                انتخاب قوانین
              </button>
            </div>
          ) : (
            pinnedDetails.map((rule) => {
              const isEnabled = rule.enabled;
              const loading = actionLoading[rule.name];

              return (
                <div
                  key={rule.name}
                  className="p-3.5 rounded-2xl glass-subtle border border-white/5 hover:border-white/15 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`} />
                      <h4 className="text-sm font-bold text-white truncate" title={rule.name}>
                        {rule.name}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isEnabled
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-white/5'
                      }`}>
                        {isEnabled ? 'فعال (Enabled)' : 'غیرفعال (Disabled)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-300 font-mono mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5 text-[11px]">
                        پورت: <strong className="text-white">{rule.port}</strong>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {rule.protocol}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {rule.direction === 'In' ? 'ورودی (Inbound)' : 'خروجی (Outbound)'}
                      </span>
                      {rule.is_open_port && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Open Port
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleToggleRule(rule.name, isEnabled)}
                      disabled={loading}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isEnabled
                          ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                      }`}
                      title={isEnabled ? 'غیرفعال کردن این قانون' : 'فعال‌سازی این قانون'}
                    >
                      <Power className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      <span>{isEnabled ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</span>
                    </button>

                    <button
                      onClick={() => handleRemovePinned(rule.name)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="حذف از پین‌ها"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Portal Modal */}
      {typeof document !== 'undefined' && modalNode && createPortal(modalNode, document.body)}
    </>
  );
}
