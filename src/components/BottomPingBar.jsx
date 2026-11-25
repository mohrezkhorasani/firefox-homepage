import React, { useState, useEffect, useCallback } from 'react';
import { Activity, RotateCcw, Wifi, Globe, Zap, CheckCircle2 } from 'lucide-react';
import { browserPing } from '../services/pingService';

// Target endpoints for probing internet quality directly from the browser window
const PING_TARGETS = [
  { id: 'google', name: 'گوگل', host: 'google.com', url: 'https://www.google.com/generate_204' },
  { id: 'fiverr', name: 'Fiverr', host: 'fiverr.com', url: 'https://www.fiverr.com/favicon.ico' },
  { id: 'cloudflare', name: 'کلودفلر', host: '1.1.1.1', url: 'https://1.1.1.1/cdn-cgi/trace' },
  { id: 'ir', name: 'داخلی', host: 'aparat.com', url: 'https://www.aparat.com/favicon.ico' }
];

export default function BottomPingBar() {
  const [results, setResults] = useState({});
  const [isPinging, setIsPinging] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Pure browser-native ping runner (zero Python calls)
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
      const res = await browserPing(target.url || target.host, 3500);
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

  // Overall latency calculation
  const validTimes = Object.values(results)
    .map((r) => r.time)
    .filter((t) => typeof t === 'number' && t > 0);

  const avgLatency =
    validTimes.length > 0 ? Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length) : null;

  // Rating and color indicator adhering to 03_color_standards.md (#hex only)
  let qualityColor = 'text-[#94a3b8]';
  let qualityBg = 'bg-[#ffffff]/10';
  let qualityBorder = 'border-[#ffffff]/10';
  let qualityText = 'در حال تست...';

  if (!isPinging && validTimes.length > 0) {
    if (avgLatency <= 60) {
      qualityColor = 'text-[#34d399]';
      qualityBg = 'bg-[#10b981]/15';
      qualityBorder = 'border-[#10b981]/30';
      qualityText = 'عالی';
    } else if (avgLatency <= 130) {
      qualityColor = 'text-[#38bdf8]';
      qualityBg = 'bg-[#06b6d4]/15';
      qualityBorder = 'border-[#06b6d4]/30';
      qualityText = 'خوب';
    } else if (avgLatency <= 250) {
      qualityColor = 'text-[#fbbf24]';
      qualityBg = 'bg-[#f59e0b]/15';
      qualityBorder = 'border-[#f59e0b]/30';
      qualityText = 'متوسط';
    } else {
      qualityColor = 'text-[#f87171]';
      qualityBg = 'bg-[#ef4444]/15';
      qualityBorder = 'border-[#ef4444]/30';
      qualityText = 'کند';
    }
  } else if (!isPinging && validTimes.length === 0 && lastCheckTime) {
    qualityColor = 'text-[#f87171]';
    qualityBg = 'bg-[#ef4444]/15';
    qualityBorder = 'border-[#ef4444]/30';
    qualityText = 'قطع';
  }

  return (
    <div
      onClick={runPing}
      className={`glass px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 select-none cursor-pointer text-shadow transition-all hover:scale-[1.02] active:scale-98 group ${qualityBorder} ${qualityBg}`}
      title="پینگ مستقیم از داخل مرورگر (بدون واسطه پایتون) - کلیک برای تست مجدد"
      dir="rtl"
    >
      {/* Right / Start: Ping title + Refresh indicator */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className={`p-1 rounded-lg ${
            isPinging ? 'bg-[#06b6d4]/30 text-[#67e8f9] animate-spin' : `${qualityBg} ${qualityColor}`
          } transition-colors`}
        >
          {isPinging ? <RotateCcw className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-[#e2e8f0] group-hover:text-[#ffffff] transition-colors">
            پینگ مرورگر
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

          let badgeColor = 'text-[#94a3b8] bg-[#ffffff]/5 border-[#ffffff]/10';
          if (isChecking) {
            badgeColor = 'text-[#fde047] bg-[#f59e0b]/10 border-[#f59e0b]/20 animate-pulse';
          } else if (isOnline && typeof time === 'number') {
            if (time <= 60) {
              badgeColor = 'text-[#6ee7b7] bg-[#10b981]/10 border-[#10b981]/20';
            } else if (time <= 130) {
              badgeColor = 'text-[#67e8f9] bg-[#06b6d4]/10 border-[#06b6d4]/20';
            } else {
              badgeColor = 'text-[#fde047] bg-[#f59e0b]/10 border-[#f59e0b]/20';
            }
          } else if (res && !isOnline) {
            badgeColor = 'text-[#f87171] bg-[#ef4444]/10 border-[#ef4444]/20';
          }

          return (
            <div
              key={target.id}
              className={`px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all ${badgeColor}`}
              title={`${target.name} (${target.host}): ${
                isChecking ? 'در حال پینگ از مرورگر...' : isOnline ? `${time}ms (پینگ مستقیم مرورگر)` : 'قطع / بدون پاسخ'
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
