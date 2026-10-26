import React, { useState } from 'react';
import { Activity, RotateCcw, Maximize2, Plus, ShieldAlert, Wifi, Globe, Copy, Check } from 'lucide-react';

export default function ServerPingWidget({
  servers = [],
  pingResults = {},
  onRefreshAll,
  onRefreshSingle,
  onOpenExtend,
  onOpenAdd,
  isRefreshing = false
}) {
  const [hoveredServerId, setHoveredServerId] = useState(null);
  const [copiedHost, setCopiedHost] = useState(null);

  // Pinned servers (up to 4)
  const pinnedServers = servers.filter((s) => s.pinned);
  const displayServers = pinnedServers.length > 0 ? pinnedServers.slice(0, 4) : servers.slice(0, 4);

  // Summary counts
  const onlineCount = servers.filter((s) => pingResults[s.id]?.online && !pingResults[s.id]?.sanctioned).length;
  const sanctionedCount = servers.filter((s) => pingResults[s.id]?.sanctioned).length;
  const offlineCount = servers.filter((s) => pingResults[s.id] && !pingResults[s.id].online).length;

  function handleCopy(e, host) {
    e.stopPropagation();
    navigator.clipboard.writeText(host);
    setCopiedHost(host);
    setTimeout(() => setCopiedHost(null), 1800);
  }

  return (
    <div className="flex flex-col gap-1.5 w-full bg-white/5 p-2 rounded-xl border border-white/10 select-none relative">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>وضعیت سرورها</span>
        </div>

        {/* Buttons: Add is ALWAYS next to Refresh */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenAdd}
            className="p-1 rounded-md text-cyan-300 hover:text-white hover:bg-white/10 transition"
            title="افزودن سرور یا دامین جدید"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className={`p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition ${
              isRefreshing ? 'animate-spin text-cyan-400' : ''
            }`}
            title="بروزرسانی پینگ همه سرورها"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Summary Bar: Live stats at a single glance without extending */}
      <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 border border-white/5 text-[10px] font-bold">
        <div className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span>{onlineCount} وصل</span>
        </div>

        {sanctionedCount > 0 && (
          <div className="flex items-center gap-1 text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
            <span>{sanctionedCount} تحریم</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-rose-400">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
          <span>{offlineCount} قطع</span>
        </div>

        <span className="text-gray-400 font-mono text-[9px] font-normal">
          کل: {servers.length}
        </span>
      </div>

      {/* 2-column compact grid of pinned servers */}
      <div className="grid grid-cols-2 gap-1 w-full">
        {displayServers.map((srv) => {
          const res = pingResults[srv.id];
          const isChecking = res?.checking;
          const isOnline = res?.online;
          const isSanctioned = res?.sanctioned;
          const latency = res?.time;
          const isHovered = hoveredServerId === srv.id;

          let dotClass = 'bg-amber-400 animate-pulse';
          let latencyText = '...';
          let latencyColor = 'text-gray-400';
          let statusLabel = 'در حال بررسی';
          let statusBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

          if (!isChecking && res !== undefined) {
            if (isSanctioned) {
              dotClass = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)]';
              latencyText = 'تحریم';
              latencyColor = 'text-purple-300 font-bold';
              statusLabel = 'تحریم (403 Forbidden)';
              statusBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            } else if (isOnline) {
              dotClass = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]';
              latencyText = latency !== null ? `${latency}ms` : 'وصل';
              latencyColor = 'text-emerald-300 font-semibold';
              statusLabel = latency !== null ? `آنلاین (${latency}ms)` : 'آنلاین';
              statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            } else {
              dotClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]';
              latencyText = 'قطع';
              latencyColor = 'text-rose-400 font-bold';
              statusLabel = 'قطع / آفلاین';
              statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            }
          }

          return (
            <div
              key={srv.id}
              className="relative"
              onMouseEnter={() => setHoveredServerId(srv.id)}
              onMouseLeave={() => setHoveredServerId(null)}
            >
              {/* Server Item Card: CLICK triggers single re-ping! */}
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 hover:border-cyan-400/30 transition-all cursor-pointer select-none group"
                onClick={() => onRefreshSingle(srv.id, srv.host)}
                title="کلیک برای تست مجدد این سرور"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${dotClass}`} />
                <div className="flex flex-col min-w-0 flex-1 leading-tight">
                  <span className="truncate text-[11px] font-medium text-gray-200 group-hover:text-white">
                    {srv.name}
                  </span>
                  <span className={`text-[9px] font-mono tracking-tight ${latencyColor}`}>
                    {latencyText}
                  </span>
                </div>
              </div>

              {/* Sticky Tooltip Card on Hover (استیکی تور شناور) */}
              {isHovered && (
                <div
                  className="absolute bottom-full mb-2 left-0 z-50 w-56 p-2.5 bg-neutral-900/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl flex flex-col gap-1.5 animate-fadeIn pointer-events-auto text-shadow"
                  dir="rtl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Tooltip Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">
                      {srv.name}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Host with Copy Button */}
                  <div className="flex items-center justify-between bg-black/50 p-1.5 rounded-lg border border-white/5 text-[10px] font-mono" dir="ltr">
                    <span className="text-gray-300 truncate max-w-[150px]">{srv.host}</span>
                    <button
                      onClick={(e) => handleCopy(e, srv.host)}
                      className="p-1 rounded text-gray-400 hover:text-white transition"
                      title="کپی آدرس"
                    >
                      {copiedHost === srv.host ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Details / Method */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400">
                    <span>روش اتصال:</span>
                    <span className="font-mono text-cyan-300 font-medium">
                      {res?.method === 'sanction-detected'
                        ? 'تحریم (403)'
                        : res?.port
                        ? `پورت ${res.port}`
                        : res?.method || 'ICMP Ping'}
                    </span>
                  </div>

                  {/* Click hint */}
                  <div
                    onClick={() => onRefreshSingle(srv.id, srv.host)}
                    className="text-[9px] text-cyan-300 hover:text-cyan-100 bg-cyan-950/40 p-1 rounded text-center cursor-pointer font-bold border border-cyan-500/20 transition"
                  >
                    👆 کلیک برای تست مجدد پینگ
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Extend / View All Button */}
      <button
        onClick={onOpenExtend}
        className="w-full flex items-center justify-between px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-cyan-300 hover:text-cyan-200 font-bold transition group"
        title="مشاهده همه سرورها در پنل کناری"
      >
        <span>مشاهده همه ({servers.length})</span>
        <Maximize2 className="w-2.5 h-2.5 text-cyan-400 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
