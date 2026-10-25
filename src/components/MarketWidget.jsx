import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sparkles, 
  Gem, 
  Smile, 
  RefreshCw,
  Activity
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
    <div className="glass rounded-2xl p-5 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span>بازار مالی و بورس ایران</span>
        </h2>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[11px] text-gray-400 font-mono">
              {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchMarketData}
            disabled={isLoading}
            className="text-gray-400 hover:text-white p-1 rounded transition disabled:opacity-50"
            title="بروزرسانی نرخ‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="space-y-3">
        {/* ۱. شاخص کل بورس */}
        <div className="bg-black/30 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <span>شاخص کل بورس</span>
                {marketData.bourse?.state && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                    {marketData.bourse.state}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-400">
                تغییر: {formatNumber(marketData.bourse?.change)} واحد
              </div>
            </div>
          </div>
          <div className="text-left" dir="ltr">
            <div className="font-bold text-sm text-emerald-300 font-mono">
              {formatNumber(marketData.bourse?.value)}
            </div>
            <div className={`text-[11px] font-bold ${isPositive(marketData.bourse?.percent) ? 'text-green-400' : 'text-rose-400'}`}>
              {marketData.bourse?.percent}%
            </div>
          </div>
        </div>

        {/* ۲. دلار و طلا ۱۸ عیار */}
        <div className="grid grid-cols-2 gap-2">
          {/* دلار */}
          <div className="bg-black/30 p-2.5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                دلار آزاد
              </span>
              <span className={`text-[10px] font-bold ${isPositive(marketData.dollar?.percent) ? 'text-green-400' : 'text-rose-400'}`} dir="ltr">
                {marketData.dollar?.percent}
              </span>
            </div>
            <div className="text-sm font-bold text-blue-300 font-mono text-left" dir="ltr">
              {formatNumber(marketData.dollar?.priceToman)}
              <span className="text-[10px] font-normal text-gray-400 mr-1">ت</span>
            </div>
          </div>

          {/* طلا ۱۸ عیار */}
          <div className="bg-black/30 p-2.5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                طلا ۱۸ عیار
              </span>
              <span className={`text-[10px] font-bold ${isPositive(marketData.gold?.percent) ? 'text-green-400' : 'text-rose-400'}`} dir="ltr">
                {marketData.gold?.percent}
              </span>
            </div>
            <div className="text-sm font-bold text-amber-300 font-mono text-left" dir="ltr">
              {formatNumber(marketData.gold?.priceToman)}
              <span className="text-[10px] font-normal text-gray-400 mr-1">ت</span>
            </div>
          </div>
        </div>

        {/* ۳. صندوق عیار و سهام لبخند */}
        <div className="grid grid-cols-2 gap-2">
          {/* صندوق عیار */}
          <div className="bg-black/30 p-2.5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                <Gem className="w-3.5 h-3.5 text-yellow-400" />
                صندوق عیار
              </span>
              <span className={`text-[10px] font-bold ${isPositive(marketData.ayar?.percent) ? 'text-green-400' : 'text-rose-400'}`} dir="ltr">
                {marketData.ayar?.percent}%
              </span>
            </div>
            <div className="text-sm font-bold text-yellow-300 font-mono text-left" dir="ltr">
              {formatNumber(marketData.ayar?.priceToman)}
              <span className="text-[10px] font-normal text-gray-400 mr-1">ت</span>
            </div>
          </div>

          {/* سهام لبخند */}
          <div className="bg-black/30 p-2.5 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-cyan-400" />
                سهام لبخند
              </span>
              <span className={`text-[10px] font-bold ${isPositive(marketData.labkhand?.percent) ? 'text-green-400' : 'text-rose-400'}`} dir="ltr">
                {marketData.labkhand?.percent}%
              </span>
            </div>
            <div className="text-sm font-bold text-cyan-300 font-mono text-left" dir="ltr">
              {formatNumber(marketData.labkhand?.priceToman)}
              <span className="text-[10px] font-normal text-gray-400 mr-1">ت</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
