import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Plus,
  Pin,
  Trash2,
  Search,
  Check,
  Copy,
  Server,
  Activity,
  Globe,
  HardDrive
} from 'lucide-react';

export default function ServerExtendModal({
  isOpen,
  onClose,
  servers = [],
  pingResults = {},
  onRefreshAll,
  onRefreshSingle,
  onTogglePin,
  onAddServer,
  onDeleteServer,
  onResetDefaults,
  isRefreshing = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | online | offline | pinned
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHost, setNewHost] = useState('');
  const [newPinned, setNewPinned] = useState(false);
  const [copiedHost, setCopiedHost] = useState(null);

  if (!isOpen) return null;

  function handleCopy(host) {
    navigator.clipboard.writeText(host);
    setCopiedHost(host);
    setTimeout(() => setCopiedHost(null), 1800);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim() || !newHost.trim()) return;

    onAddServer({
      id: 'srv_' + Date.now(),
      name: newName.trim(),
      host: newHost.trim(),
      pinned: newPinned,
      isInternal: /^(\d{1,3}\.){3}\d{1,3}$/.test(newHost.trim()) && (
        newHost.trim().startsWith('192.168.') ||
        newHost.trim().startsWith('10.') ||
        newHost.trim().startsWith('172.')
      )
    });

    setNewName('');
    setNewHost('');
    setNewPinned(false);
    setShowAddForm(false);
  }

  // Filter logic
  const filteredServers = servers.filter((srv) => {
    const res = pingResults[srv.id];
    const matchesSearch =
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.host.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'online') return res?.online === true;
    if (filterType === 'offline') return res && res.online === false;
    if (filterType === 'pinned') return srv.pinned;
    return true;
  });

  const onlineCount = servers.filter((s) => pingResults[s.id]?.online).length;
  const offlineCount = servers.filter((s) => pingResults[s.id] && !pingResults[s.id].online).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900/95 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                وضعیت سرورها و اتصالات
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                  {servers.length} سرور
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs mt-0.5 font-medium">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {onlineCount} آنلاین
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {offlineCount} قطع
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-gray-200 hover:text-white border border-white/10 transition ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="تست مجدد همه سرورها"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isRefreshing ? 'در حال بررسی...' : 'بروزرسانی'}</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                showAddForm
                  ? 'bg-cyan-600 text-white border-cyan-400'
                  : 'bg-white/10 text-cyan-300 hover:bg-white/20 border-white/10'
              }`}
              title="افزودن سرور یا دامنه جدید"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Server Collapsible Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="p-4 bg-cyan-950/30 border-b border-cyan-500/20 flex flex-col gap-3 animate-fadeIn"
          >
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>مشخصات سرور یا دامنه جدید:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">نام یا عنوان نمایشی:</label>
                <input
                  type="text"
                  placeholder="مثال: سرور پشتیبان، گیت‌هاب"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">آدرس IP یا دامنه:</label>
                <input
                  type="text"
                  placeholder="مثال: 192.168.0.50 یا github.com"
                  value={newHost}
                  onChange={(e) => setNewHost(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                  className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0"
                />
                <span className="flex items-center gap-1">
                  <Pin className="w-3 h-3 text-amber-400" />
                  پین کردن در منوی سریع (پایین صفحه)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition"
                >
                  ثبت سرور
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-white/5 bg-black/30 flex flex-wrap items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو در سرورها یا آدرس‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: 'all', label: 'همه' },
              { id: 'online', label: '🟢 آنلاین' },
              { id: 'offline', label: '🔴 قطع' },
              { id: 'pinned', label: '📌 پین شده' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Server List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[50vh] custom-scrollbar">
          {filteredServers.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs">
              هیچ سروری مطابق با فیلتر یافت نشد.
            </div>
          ) : (
            filteredServers.map((srv) => {
              const res = pingResults[srv.id];
              const isChecking = res?.checking;
              const isOnline = res?.online;
              const latency = res?.time;

              let dotClass = 'bg-amber-400 animate-pulse';
              let badgeBg = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
              let statusText = 'در حال بررسی...';

              if (!isChecking && res !== undefined) {
                if (isOnline) {
                  dotClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]';
                  badgeBg = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                  statusText = latency !== null ? `${latency} ms` : 'آنلاین';
                } else {
                  dotClass = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]';
                  badgeBg = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
                  statusText = 'قطع';
                }
              }

              return (
                <div
                  key={srv.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition group"
                >
                  {/* Status & Name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-100 truncate">
                          {srv.name}
                        </span>
                        {srv.pinned && (
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium"
                            title="پین شده در منوی سریع"
                          >
                            پین شده
                          </span>
                        )}
                        {srv.isInternal ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium hidden sm:inline-block">
                            شبکه داخلی
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium hidden sm:inline-block">
                            اینترنت
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono mt-0.5" dir="ltr">
                        <span className="truncate">{srv.host}</span>
                        <button
                          onClick={() => handleCopy(srv.host)}
                          className="text-gray-500 hover:text-white transition p-0.5 rounded"
                          title="کپی آدرس"
                        >
                          {copiedHost === srv.host ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Latency Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Latency badge */}
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border font-semibold min-w-[56px] text-center ${badgeBg}`}
                    >
                      {statusText}
                    </span>

                    {/* Single Ping */}
                    <button
                      onClick={() => onRefreshSingle(srv.id, srv.host)}
                      disabled={isChecking}
                      className={`p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition ${
                        isChecking ? 'animate-spin text-cyan-400' : ''
                      }`}
                      title="بررسی مجدد این سرور"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Pin Toggle */}
                    <button
                      onClick={() => onTogglePin(srv.id)}
                      className={`p-1.5 rounded-lg transition ${
                        srv.pinned
                          ? 'text-amber-400 bg-amber-400/15 hover:bg-amber-400/25'
                          : 'text-gray-500 hover:text-gray-200 hover:bg-white/10'
                      }`}
                      title={srv.pinned ? 'حذف پین از منوی سریع' : 'پین در منوی سریع'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Server */}
                    <button
                      onClick={() => onDeleteServer(srv.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="حذف سرور"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-gray-400">
          <button
            onClick={onResetDefaults}
            className="text-[11px] text-gray-400 hover:text-amber-300 underline underline-offset-4 transition"
            title="بازنشانی سرورها به لیست اولیه"
          >
            بازنشانی به لیست پیش‌فرض
          </button>

          <span className="text-[10px] text-gray-500">
            بروزرسانی خودکار هر ۴۵ ثانیه
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition text-xs"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
