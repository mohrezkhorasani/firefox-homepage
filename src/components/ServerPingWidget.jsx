import React from 'react';
import { Activity, RotateCcw, Maximize2 } from 'lucide-react';

export default function ServerPingWidget({
  servers = [],
  pingResults = {},
  onRefreshAll,
  onOpenExtend,
  isRefreshing = false
}) {
  // Show pinned servers, or first 4 if none are pinned
  const pinnedServers = servers.filter((s) => s.pinned);
  const displayServers = pinnedServers.length > 0 ? pinnedServers.slice(0, 4) : servers.slice(0, 4);

  return (
    <div className="flex flex-col gap-1.5 w-full bg-white/5 p-2 rounded-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>وضعیت سرورها</span>
        </div>
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className={`p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition ${
            isRefreshing ? 'animate-spin text-cyan-400' : ''
          }`}
          title="بروزرسانی پینگ سرورها"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* 2-column compact grid */}
      <div className="grid grid-cols-2 gap-1 w-full">
        {displayServers.map((srv) => {
          const res = pingResults[srv.id];
          const isChecking = res?.checking;
          const isOnline = res?.online;
          const latency = res?.time;

          let dotClass = 'bg-amber-400 animate-pulse';
          let latencyText = '...';
          let statusLabel = 'در حال بررسی';

          if (!isChecking && res !== undefined) {
            if (isOnline) {
              dotClass = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]';
              latencyText = latency !== null ? `${latency}ms` : 'آنلاین';
              statusLabel = latency !== null ? `آنلاین (${latency}ms)` : 'آنلاین';
            } else {
              dotClass = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]';
              latencyText = 'قطع';
              statusLabel = 'قطع / آفلاین';
            }
          }

          return (
            <div
              key={srv.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 transition-colors cursor-pointer select-none group"
              onClick={onOpenExtend}
              title={`${srv.name} (${srv.host})\nوضعیت: ${statusLabel}\nکلیک برای مشاهده لیست کامل`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${dotClass}`} />
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className="truncate text-[11px] font-medium text-gray-200 group-hover:text-white">
                  {srv.name}
                </span>
                <span className="text-[9px] text-gray-400 font-mono tracking-tight">
                  {latencyText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extend / View All Button */}
      <button
        onClick={onOpenExtend}
        className="w-full flex items-center justify-between px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-cyan-300 hover:text-cyan-200 font-bold transition group"
        title="مشاهده همه سرورها و مدیریت پینگ"
      >
        <span>مشاهده همه ({servers.length})</span>
        <Maximize2 className="w-2.5 h-2.5 text-cyan-400 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
}
