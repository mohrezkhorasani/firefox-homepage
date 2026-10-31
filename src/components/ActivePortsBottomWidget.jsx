import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, ChevronUp, ChevronDown, Radio, Activity } from 'lucide-react';
import { fetchListeningPorts } from '../services/windowsAgentService';

export default function ActivePortsBottomWidget() {
  const [ports, setPorts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadPorts(force = false) {
    setIsLoading(true);
    try {
      const data = await fetchListeningPorts(force);
      setPorts(data.ports || []);
      setLastUpdated(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to load active ports:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPorts();
  }, []);

  return (
    <div className="fixed bottom-2 right-2 z-40" dir="rtl">
      {/* Expanded Popup List */}
      {isExpanded && (
        <div className="mb-2 w-80 sm:w-96 max-h-[380px] bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-3 flex flex-col text-white animate-fade-in select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Network className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold">پورت‌های شنوا (Listening Ports)</span>
            </div>

            <div className="flex items-center gap-1.5">
              {lastUpdated && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {lastUpdated}
                </span>
              )}
              <button
                onClick={() => loadPorts(true)}
                disabled={isLoading}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                title="به‌روزرسانی پورت‌ها"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {ports.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-xs">
                {isLoading ? 'در حال دریافت پورت‌ها...' : 'هیچ پورت فعالی یافت نشد یا ایجنت متصل نیست.'}
              </p>
            ) : (
              ports.map((p, idx) => (
                <div
                  key={`${p.port}-${p.pid}-${idx}`}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                    <span className="font-mono font-bold text-white text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      :{p.port}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-slate-200 truncate font-semibold">
                        {p.process}
                      </p>
                      {p.service && (
                        <p className="text-[9px] text-slate-400 truncate">
                          {p.service}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left shrink-0 font-mono text-[10px] text-slate-400">
                    <span>PID: {p.pid}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Bottom Right Bar / Pill Button */}
      <div className="glass-subtle bg-slate-900/90 backdrop-blur-md border border-white/15 hover:border-white/25 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 text-white select-none transition">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 transition text-xs font-semibold"
          title="مشاهده پورت‌های شنوا و پروسه‌های متناظر"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <Network className="w-3.5 h-3.5 text-cyan-400" />
          <span>پورت‌های فعال</span>
          <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
            {ports.length}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        <button
          onClick={() => loadPorts(true)}
          disabled={isLoading}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          title="به‌روزرسانی پورت‌ها"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </div>
  );
}
