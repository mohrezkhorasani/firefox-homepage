import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sparkles, 
  Gem, 
  Smile, 
  RefreshCw,
  Activity,
  ExternalLink
} from 'lucide-react';

const INITIAL_DATA = {
  bourse: { value: 8015516, change: -29140, percent: '-0.36', state: 'بسته' },
  dollar: { priceToman: 269500, percent: '0.37', dt: 'high' },
  gold: { priceToman: 26242900, percent: '0.69', dt: 'high' },
  ayar: { priceRial: 719877, priceToman: 71988, percent: '0.57' },
  labkhand: { priceRial: 31846, priceToman: 3185, percent: '0.13' }
};

export default function MarketWidget() {
  const [marketData, setMarketData] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_market_data');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    return localStorage.getItem('homepage_market_time') || '';
  });

  const fetchMarketData = async () => {
    setIsLoading(true);
    const updated = { ...marketData };

    try {
      const tsetmcBase = window.location.protocol.startsWith('http') ? '/api/tsetmc' : 'https://cdn.tsetmc.com';

      // 1. بورس ایران (شاخص کل)
      try {
        let res = await fetch(`${tsetmcBase}/api/MarketData/GetMarketOverview/1`, { cache: 'no-store' });
        if (!res.ok) {
          res = await fetch('https://cdn.tsetmc.com/api/MarketData/GetMarketOverview/1', { cache: 'no-store' });
        }
        if (res.ok) {
          const data = await res.json();
          const ov = data.marketOverview;
          if (ov && ov.indexLastValue) {
            const ch = ov.indexChange || 0;
            const val = ov.indexLastValue;
            const pct = val !== ch ? ((ch / (val - ch)) * 100).toFixed(2) : '0';
            updated.bourse = {
              value: Math.round(val),
              change: Math.round(ch),
              percent: (Number(pct) > 0 ? '+' : '') + pct,
              state: ov.marketStateTitle || 'فعال'
            };
          }
        }
      } catch (err) {}

      // 2. نماد عیار (صندوق طلای عیار مفید - 34144395039913458)
      try {
        let res = await fetch(`${tsetmcBase}/api/ClosingPrice/GetClosingPriceInfo/34144395039913458`, { cache: 'no-store' });
        if (!res.ok) {
          res = await fetch('https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceInfo/34144395039913458', { cache: 'no-store' });
        }
        if (res.ok) {
          const data = await res.json();
          const cp = data.closingPriceInfo;
          if (cp && (cp.pDrCotVal || cp.pClosing)) {
            const price = cp.pDrCotVal || cp.pClosing;
            const yest = cp.priceYesterday || price;
            const pct = (((price - yest) / yest) * 100).toFixed(2);
            updated.ayar = {
              priceRial: price,
              priceToman: Math.round(price / 10),
              percent: (Number(pct) > 0 ? '+' : '') + pct
            };
          }
        }
      } catch (err) {}

      // 3. سهام لبخند (صندوق لبخند فارابی - 31569200988534548)
      try {
        let res = await fetch(`${tsetmcBase}/api/ClosingPrice/GetClosingPriceInfo/31569200988534548`, { cache: 'no-store' });
        if (!res.ok) {
          res = await fetch('https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceInfo/31569200988534548', { cache: 'no-store' });
        }
        if (res.ok) {
          const data = await res.json();
          const cp = data.closingPriceInfo;
          if (cp && (cp.pDrCotVal || cp.pClosing)) {
            const price = cp.pDrCotVal || cp.pClosing;
            const yest = cp.priceYesterday || price;
            const pct = (((price - yest) / yest) * 100).toFixed(2);
            updated.labkhand = {
              priceRial: price,
              priceToman: Math.round(price / 10),
              percent: (Number(pct) > 0 ? '+' : '') + pct
            };
          }
        }
      } catch (err) {}

      // 4. دلار و طلا ۱۸ عیار (از TGJU یا Wallex)
      try {
        const tgjuUrl = window.location.protocol.startsWith('http') ? '/api/tgju/ajax.json' : 'https://call.tgju.org/ajax.json';
        const res = await fetch(tgjuUrl, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const cur = data.current || {};
          if (cur.price_dollar_rl && cur.price_dollar_rl.p) {
            const pRial = parseFloat(cur.price_dollar_rl.p.replace(/,/g, ''));
            const dp = cur.price_dollar_rl.dp || 0;
            const sign = cur.price_dollar_rl.dt === 'low' ? '-' : '+';
            updated.dollar = {
              priceToman: Math.round(pRial / 10),
              percent: sign + dp + '%',
              dt: cur.price_dollar_rl.dt
            };
          }
          if (cur.geram18 && cur.geram18.p) {
            const pRial = parseFloat(cur.geram18.p.replace(/,/g, ''));
            const dp = cur.geram18.dp || 0;
            const sign = cur.geram18.dt === 'low' ? '-' : '+';
            updated.gold = {
              priceToman: Math.round(pRial / 10),
              percent: sign + dp + '%',
              dt: cur.geram18.dt
            };
          }
        } else {
          throw new Error('TGJU non-ok');
        }
      } catch (e) {
        // Fallback به Wallex
        try {
          const wallexUrl = window.location.protocol.startsWith('http') ? '/api/wallex/v1/markets' : 'https://api.wallex.ir/v1/markets';
          const res = await fetch(wallexUrl, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            const usdt = data.result?.symbols?.USDTTMN;
            const paxg = data.result?.symbols?.PAXGTMN;
            if (usdt && usdt.stats?.lastPrice) {
              const ch = parseFloat(usdt.stats['24h_ch'] || 0);
              updated.dollar = {
                priceToman: Math.round(parseFloat(usdt.stats.lastPrice)),
                percent: (ch > 0 ? '+' : '') + ch + '%',
                dt: ch >= 0 ? 'high' : 'low'
              };
            }
            if (paxg && paxg.stats?.lastPrice) {
              const gold18 = Math.round((parseFloat(paxg.stats.lastPrice) / 31.1035) * 0.75);
              const ch = parseFloat(paxg.stats['24h_ch'] || 0);
              updated.gold = {
                priceToman: gold18,
                percent: (ch > 0 ? '+' : '') + ch + '%',
                dt: ch >= 0 ? 'high' : 'low'
              };
            }
          }
        } catch (errWallex) {}
      }

      setMarketData(updated);
      localStorage.setItem('homepage_market_data', JSON.stringify(updated));

      const nowTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(nowTime);
      localStorage.setItem('homepage_market_time', nowTime);
    } catch (globalErr) {
      console.warn('Market update error:', globalErr);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // آپدیت هر ۶۰ ثانیه
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-';
    return Number(num).toLocaleString('fa-IR');
  };

  const isPositive = (pctStr) => {
    if (!pctStr) return true;
    return !String(pctStr).includes('-');
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 border border-white/20 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/15 pb-2.5 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span>بازار مالی</span>
          </h2>

          {/* ایزی تریدر Link Button */}
          <a
            href="https://easytrader.emofid.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 text-[11px] font-bold transition shadow-sm group"
            title="ورود به سامانه معاملات ایزی تریدر مفید (EasyTrader)"
          >
            <span>ایزی تریدر</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-gray-400 font-mono">
              {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchMarketData}
            disabled={isLoading}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
            title="بروزرسانی نرخ‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="space-y-2.5">
        {/* ۱. شاخص کل بورس */}
        <div className="bg-black/45 hover:bg-black/60 border border-white/10 p-3 rounded-xl transition flex items-center justify-between group">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span>شاخص کل بورس</span>
                {marketData.bourse?.state && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-medium">
                    {marketData.bourse.state}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                تغییر: {formatNumber(marketData.bourse?.change)} واحد
              </div>
            </div>
          </div>
          <div className="text-left flex flex-col items-end" dir="ltr">
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-sm">
              {formatNumber(marketData.bourse?.value)}
            </div>
            <div
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                isPositive(marketData.bourse?.percent)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {marketData.bourse?.percent}%
            </div>
          </div>
        </div>

        {/* ۲. دلار و طلا ۱۸ عیار */}
        <div className="grid grid-cols-2 gap-2">
          {/* دلار */}
          <div className="bg-black/45 hover:bg-black/60 border border-white/10 p-2.5 rounded-xl transition flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-300 font-bold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                دلار آزاد
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isPositive(marketData.dollar?.percent)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
                dir="ltr"
              >
                {marketData.dollar?.percent}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-white/5" dir="ltr">
              <span className="text-base sm:text-lg font-black text-white font-mono tracking-wide drop-shadow-sm group-hover:text-blue-300 transition-colors">
                {formatNumber(marketData.dollar?.priceToman)}
              </span>
              <span className="text-[10px] font-bold text-gray-400 font-sans" dir="rtl">تومان</span>
            </div>
          </div>

          {/* طلا ۱۸ عیار */}
          <div className="bg-black/45 hover:bg-black/60 border border-white/10 p-2.5 rounded-xl transition flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                طلا ۱۸ عیار
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isPositive(marketData.gold?.percent)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
                dir="ltr"
              >
                {marketData.gold?.percent}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-white/5" dir="ltr">
              <span className="text-base sm:text-lg font-black text-white font-mono tracking-wide drop-shadow-sm group-hover:text-amber-300 transition-colors">
                {formatNumber(marketData.gold?.priceToman)}
              </span>
              <span className="text-[10px] font-bold text-gray-400 font-sans" dir="rtl">تومان</span>
            </div>
          </div>
        </div>

        {/* ۳. صندوق عیار و سهام لبخند */}
        <div className="grid grid-cols-2 gap-2">
          {/* صندوق عیار */}
          <div className="bg-black/45 hover:bg-black/60 border border-white/10 p-2.5 rounded-xl transition flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-300 font-bold flex items-center gap-1">
                <Gem className="w-3.5 h-3.5 text-yellow-400" />
                صندوق عیار
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isPositive(marketData.ayar?.percent)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
                dir="ltr"
              >
                {marketData.ayar?.percent}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-white/5" dir="ltr">
              <span className="text-base sm:text-lg font-black text-white font-mono tracking-wide drop-shadow-sm group-hover:text-yellow-300 transition-colors">
                {formatNumber(marketData.ayar?.priceToman)}
              </span>
              <span className="text-[10px] font-bold text-gray-400 font-sans" dir="rtl">تومان</span>
            </div>
          </div>

          {/* سهام لبخند */}
          <div className="bg-black/45 hover:bg-black/60 border border-white/10 p-2.5 rounded-xl transition flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-300 font-bold flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-cyan-400" />
                سهام لبخند
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  isPositive(marketData.labkhand?.percent)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
                dir="ltr"
              >
                {marketData.labkhand?.percent}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-white/5" dir="ltr">
              <span className="text-base sm:text-lg font-black text-white font-mono tracking-wide drop-shadow-sm group-hover:text-cyan-300 transition-colors">
                {formatNumber(marketData.labkhand?.priceToman)}
              </span>
              <span className="text-[10px] font-bold text-gray-400 font-sans" dir="rtl">تومان</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
