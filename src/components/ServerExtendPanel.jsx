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
  Activity
} from 'lucide-react';

export default function ServerExtendPanel({
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
  isRefreshing = false,
  initialShowAdd = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | online | offline | pinned | sanctioned
  const [showAddForm, setShowAddForm] = useState(initialShowAdd);
  const [newName, setNewName] = useState('');
  const [newHost, setNewHost] = useState('');
  const [newPinned, setNewPinned] = useState(false);
  const [copiedHost, setCopiedHost] = useState(null);

  if (!isOpen) return null;

  function handleCopy(e, host) {
    e.stopPropagation();
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
      isInternal: /^(\d{1,3}\.){3}\d{1,3}/.test(newHost.trim()) && (
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

    if (filterType === 'online') return res?.online === true && !res?.sanctioned;
    if (filterType === 'sanctioned') return res?.sanctioned === true;
    if (filterType === 'offline') return res && res.online === false;
    if (filterType === 'pinned') return srv.pinned;
    return true;
  });

  const onlineCount = servers.filter((s) => pingResults[s.id]?.online && !pingResults[s.id]?.sanctioned).length;
  const sanctionedCount = servers.filter((s) => pingResults[s.id]?.sanctioned).length;
  const offlineCount = servers.filter((s) => pingResults[s.id] && !pingResults[s.id].online).length;

  return (
    <div
      className="fixed bottom-2 left-[225px] z-50 w-[380px] max-w-[calc(100vw-240px)] max-h-[85vh] bg-neutral-900/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideRight select-none"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 shrink-0">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>لیست سرورها</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-white/10 text-gray-300">
                {servers.length}
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[10px] mt-0.5 font-medium">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {onlineCount} وصل
              </span>
              {sanctionedCount > 0 && (
                <span className="text-purple-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {sanctionedCount} تحریم
                </span>
              )}
              <span className="text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {offlineCount} قطع
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition border ${
              showAddForm
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-white/10 text-cyan-300 hover:bg-white/20 border-white/10'
            }`}
            title="افزودن سرور یا دامنه جدید"
          >
            <Plus className="w-3 h-3" />
            <span>افزودن</span>
          </button>

          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className={`p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
            title="تست مجدد همه سرورها"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="بستن پنل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="p-3 bg-cyan-950/40 border-b border-cyan-500/20 flex flex-col gap-2.5 animate-fadeIn"
        >
          <div className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
            <Server className="w-3 h-3" />
            <span>مشخصات سرور یا دامنه جدید:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">عنوان نمایشی:</label>
              <input
                type="text"
                placeholder="مثلاً: وب سرور، میکروتیک"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2.5 py-1 rounded bg-black/60 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">IP یا دامنه (+پورت):</label>
              <input
                type="text"
                placeholder="192.168.0.4:1940"
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                className="w-full px-2.5 py-1 rounded bg-black/60 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-300">
              <input
                type="checkbox"
                checked={newPinned}
                onChange={(e) => setNewPinned(e.target.checked)}
                className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Pin className="w-2.5 h-2.5 text-amber-400" />
                پین در منوی سریع
              </span>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 rounded text-[11px] text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition shadow"
              >
                ثبت
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="p-2 border-b border-white/5 bg-black/30 flex items-center justify-between gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3 h-3 absolute right-2.5 top-2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="جستجو در سرورها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-7 pl-2 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-0.5 text-[10px]">
          {[
            { id: 'all', label: 'همه' },
            { id: 'online', label: '🟢' },
            { id: 'sanctioned', label: '🟣' },
            { id: 'offline', label: '🔴' },
            { id: 'pinned', label: '📌' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-1.5 py-1 rounded transition ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Server List */}
      <div className="p-2 overflow-y-auto flex-1 space-y-1.5 max-h-[50vh] custom-scrollbar">
        {filteredServers.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-xs">
            هیچ سروری یافت نشد.
          </div>
        ) : (
          filteredServers.map((srv) => {
            const res = pingResults[srv.id];
            const isChecking = res?.checking;
            const isOnline = res?.online;
            const isSanctioned = res?.sanctioned;
            const latency = res?.time;

            let dotClass = 'bg-amber-400 animate-pulse';
            let badgeBg = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
            let statusText = '...';

            if (!isChecking && res !== undefined) {
              if (isSanctioned) {
                dotClass = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)]';
                badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                statusText = 'تحریم (403)';
              } else if (isOnline) {
                dotClass = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]';
                badgeBg = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                statusText = latency !== null ? `${latency}ms` : 'آنلاین';
              } else {
                dotClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]';
                badgeBg = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
                statusText = 'قطع';
              }
            }

            return (
              <div
                key={srv.id}
                onClick={() => onRefreshSingle(srv.id, srv.host)}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-400/20 transition group cursor-pointer"
                title="کلیک برای تست مجدد پینگ این سرور"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-100 truncate">
                        {srv.name}
                      </span>
                      {srv.pinned && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-medium">
                          پین
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5" dir="ltr">
                      <span className="truncate">{srv.host}</span>
                      <button
                        onClick={(e) => handleCopy(e, srv.host)}
                        className="text-gray-500 hover:text-white transition p-0.5"
                        title="کپی آدرس"
                      >
                        {copiedHost === srv.host ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold min-w-[50px] text-center ${badgeBg}`}>
                    {statusText}
                  </span>

                  <button
                    onClick={() => onRefreshSingle(srv.id, srv.host)}
                    disabled={isChecking}
                    className={`p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition ${
                      isChecking ? 'animate-spin text-cyan-400' : ''
                    }`}
                    title="تست مجدد"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onTogglePin(srv.id)}
                    className={`p-1 rounded transition ${
                      srv.pinned
                        ? 'text-amber-400 bg-amber-400/15'
                        : 'text-gray-500 hover:text-gray-200 hover:bg-white/10'
                    }`}
                    title={srv.pinned ? 'حذف پین' : 'پین'}
                  >
                    <Pin className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDeleteServer(srv.id)}
                    className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 bg-white/5 flex items-center justify-between text-[10px] text-gray-400">
        <button
          onClick={onResetDefaults}
          className="text-gray-400 hover:text-amber-300 underline transition"
        >
          بازنشانی پیش‌فرض
        </button>
        <span className="text-gray-500">خودکار هر ۴۵ ثانیه</span>
        <button
          onClick={onClose}
          className="px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-medium transition"
        >
          بستن
        </button>
      </div>
    </div>
  );
}
