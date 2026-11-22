import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RotateCcw, Wifi, Globe, Zap } from 'lucide-react';
import { pingHost } from '../services/pingService';

// Target endpoints for probing internet speed & quality
const PING_TARGETS = [
  { id: 'google', name: 'گوگل', host: 'google.com' },
  { id: 'dns1', name: 'کلودفلر', host: '1.1.1.1' },
  { id: 'dns4', name: '4.2.2.4', host: '4.2.2.4' },
  { id: 'ir', name: 'داخلی', host: 'aparat.com' }
];

export default function BottomPingBar() {
  const [results, setResults] = useState({});
  const [isPinging, setIsPinging] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  const runPing = useCallback(async () => {
    setIsPinging(true);
    setResults((prev) => {
      const next = { ...prev };
      PING_TARGETS.forEach((t) => {
        next[t.id] = { ...(next[t.id] || {}), checking: true };
      });
      return next;
    });

    const promises = PING_TARGETS.map(async (target) => {
      const res = await pingHost(target.host);
      setResults((prev) => ({
        ...prev,
        [target.id]: {
          ...res,
          checking: false
        }
      }));
    });

    await Promise.all(promises);
    setIsPinging(false);
    setLastCheckTime(Date.now());
  }, []);

  // Ping on initial mount
  useEffect(() => {
    runPing();
  }, [runPing]);

  // Overall latency calculation (best or average ping)
  const validTimes = Object.values(results)
    .map((r) => r.time)
    .filter((t) => typeof t === 'number' && t > 0);

  const avgLatency =
    validTimes.length > 0 ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : null;

  // Rating and color indicator
  let qualityColor = 'text-gray-400';
  let qualityBg = 'bg-white/10';
  let qualityBorder = 'border-white/10';
  let qualityText = 'در حال تست...';

  if (!isPinging && validTimes.length > 0) {
    if (avgLatency <= 45) {
      qualityColor = 'text-emerald-400';
      qualityBg = 'bg-emerald-500/15';
      qualityBorder = 'border-emerald-500/30';
      qualityText = 'عالی';
    } else if (avgLatency <= 110) {
      qualityColor = 'text-cyan-400';
      qualityBg = 'bg-cyan-500/15';
      qualityBorder = 'border-cyan-500/30';
      qualityText = 'خوب';
    } else if (avgLatency <= 200) {
      qualityColor = 'text-amber-400';
      qualityBg = 'bg-amber-500/15';
      qualityBorder = 'border-amber-500/30';
      qualityText = 'متوسط';
    } else {
      qualityColor = 'text-rose-400';
      qualityBg = 'bg-rose-500/15';
      qualityBorder = 'border-rose-500/30';
      qualityText = 'کند';
    }
  } else if (!isPinging && validTimes.length === 0 && lastCheckTime) {
    qualityColor = 'text-rose-400';
    qualityBg = 'bg-rose-500/15';
    qualityBorder = 'border-rose-500/30';
    qualityText = 'قطع';
  }

  return (
    <div
      onClick={runPing}
      className={`glass px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 select-none cursor-pointer text-shadow transition-all hover:scale-[1.02] active:scale-98 group ${qualityBorder} ${qualityBg}`}
      title="کلیک برای تست مجدد پینگ و سرعت اینترنت"
      dir="rtl"
    >
      {/* Right / Start: Ping title + Refresh indicator */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className={`p-1 rounded-lg ${
            isPinging ? 'bg-cyan-500/30 text-cyan-300 animate-spin' : `${qualityBg} ${qualityColor}`
          } transition-colors`}
        >
          {isPinging ? <RotateCcw className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-gray-200 group-hover:text-white transition-colors">
            پینگ
          </span>
          {avgLatency !== null && (
            <span className={`text-[10px] font-mono font-bold ${qualityColor}`} dir="ltr">
              {avgLatency}ms
            </span>
          )}
          <span
            className={`text-[9px] px-1 py-0.2 rounded font-medium ${qualityBg} ${qualityColor} border ${qualityBorder}`}
          >
            {qualityText}
          </span>
        </div>
      </div>

      {/* Targets individual pings */}
      <div className="flex items-center gap-1.5 font-mono text-[9px]" dir="ltr">
        {PING_TARGETS.map((target) => {
          const res = results[target.id];
          const isChecking = res?.checking || isPinging;
          const time = res?.time;
          const isOnline = res?.online;

          let badgeColor = 'text-gray-400 bg-white/5 border-white/10';
          if (isChecking) {
            badgeColor = 'text-amber-300 bg-amber-500/10 border-amber-500/20 animate-pulse';
          } else if (isOnline && typeof time === 'number') {
            if (time <= 50) {
              badgeColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
            } else if (time <= 120) {
              badgeColor = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20';
            } else {
              badgeColor = 'text-amber-300 bg-amber-500/10 border-amber-500/20';
            }
          } else if (res && !isOnline) {
            badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
          }

          return (
            <div
              key={target.id}
              className={`px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all ${badgeColor}`}
              title={`${target.name} (${target.host}): ${
                isChecking ? 'در حال پینگ...' : isOnline ? `${time}ms` : 'قطع / بدون پاسخ'
              }`}
            >
              <span className="text-[8px] opacity-75">{target.name}</span>
              <span className="font-bold">
                {isChecking ? '...' : isOnline && typeof time === 'number' ? `${time}` : '✕'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
