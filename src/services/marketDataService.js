import { MARKET_CATALOG } from '../data/marketCatalog';

/**
 * Service to fetch prices for any market asset (Crypto, Forex, Bourse, Gold, Currencies)
 */

export async function fetchAllMarketPrices(pinnedCatalogItems) {
  const results = {};

  // Track what needs to be fetched
  const hasWallex = pinnedCatalogItems.some((item) => item.type?.startsWith('wallex'));
  const hasTgju = pinnedCatalogItems.some((item) => item.type?.startsWith('tgju'));
  const tsetmcStockIds = pinnedCatalogItems
    .filter((item) => item.type === 'tsetmc_stock')
    .map((item) => item.sourceKey);
  const hasTsetmcOverview = pinnedCatalogItems.some((item) => item.type === 'tsetmc_overview');

  let wallexSymbols = null;
  let tgjuCurrent = null;
  let tsetmcOverview = null;
  const tsetmcStocks = {};

  // 1. Fetch Wallex for Crypto
  if (hasWallex) {
    try {
      const wallexBase = window.location.protocol.startsWith('http') ? '/api/wallex/v1/markets' : 'https://api.wallex.ir/v1/markets';
      let res = await fetch(wallexBase, { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch('https://api.wallex.ir/v1/markets', { cache: 'no-store' });
      }
      if (res.ok) {
        const json = await res.json();
        wallexSymbols = json.result?.symbols || {};
      }
    } catch (e) {
      console.warn('Wallex fetch error:', e);
    }
  }

  // 2. Fetch TGJU for Gold, Forex, Currencies
  if (hasTgju) {
    try {
      const tgjuBase = window.location.protocol.startsWith('http') ? '/api/tgju/ajax.json' : 'https://call.tgju.org/ajax.json';
      let res = await fetch(tgjuBase, { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch('https://call.tgju.org/ajax.json', { cache: 'no-store' });
      }
      if (res.ok) {
        const json = await res.json();
        tgjuCurrent = json.current || {};
      }
    } catch (e) {
      console.warn('TGJU fetch error:', e);
    }
  }

  // 3. Fetch TSETMC Overview for Bourse Index
  if (hasTsetmcOverview) {
    try {
      const tsetmcBase = window.location.protocol.startsWith('http') ? '/api/tsetmc' : 'https://cdn.tsetmc.com';
      let res = await fetch(`${tsetmcBase}/api/MarketData/GetMarketOverview/1`, { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch('https://cdn.tsetmc.com/api/MarketData/GetMarketOverview/1', { cache: 'no-store' });
      }
      if (res.ok) {
        const json = await res.json();
        tsetmcOverview = json.marketOverview || {};
      }
    } catch (e) {
      console.warn('TSETMC Overview fetch error:', e);
    }
  }

  // 4. Fetch TSETMC individual stocks
  if (tsetmcStockIds.length > 0) {
    const tsetmcBase = window.location.protocol.startsWith('http') ? '/api/tsetmc' : 'https://cdn.tsetmc.com';
    await Promise.all(
      tsetmcStockIds.map(async (tid) => {
        try {
          let res = await fetch(`${tsetmcBase}/api/ClosingPrice/GetClosingPriceInfo/${tid}`, { cache: 'no-store' });
          if (!res.ok) {
            res = await fetch(`https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceInfo/${tid}`, { cache: 'no-store' });
          }
          if (res.ok) {
            const json = await res.json();
            tsetmcStocks[tid] = json.closingPriceInfo || {};
          }
        } catch (e) {}
      })
    );
  }

  // Now parse each pinned item
  for (const item of pinnedCatalogItems) {
    try {
      if (item.type === 'tsetmc_overview') {
        if (tsetmcOverview && tsetmcOverview.indexLastValue) {
          const val = tsetmcOverview.indexLastValue;
          const ch = tsetmcOverview.indexChange || 0;
          const pct = val !== ch ? ((ch / (val - ch)) * 100).toFixed(2) : '0';
          results[item.id] = {
            priceRaw: Math.round(val),
            priceFormatted: Number(Math.round(val)).toLocaleString('fa-IR'),
            changeRaw: Math.round(ch),
            percent: (Number(pct) > 0 ? '+' : '') + pct,
            isPositive: Number(pct) >= 0,
            unit: item.unit,
            state: tsetmcOverview.marketStateTitle || 'فعال'
          };
        }
      } else if (item.type === 'tsetmc_stock') {
        const cp = tsetmcStocks[item.sourceKey];
        if (cp && (cp.pDrCotVal || cp.pClosing)) {
          const priceRial = cp.pDrCotVal || cp.pClosing;
          const yestRial = cp.priceYesterday || priceRial;
          const pct = (((priceRial - yestRial) / yestRial) * 100).toFixed(2);
          const priceToman = Math.round(priceRial / 10);
          results[item.id] = {
            priceRaw: priceToman,
            priceFormatted: Number(priceToman).toLocaleString('fa-IR'),
            percent: (Number(pct) > 0 ? '+' : '') + pct,
            isPositive: Number(pct) >= 0,
            unit: 'تومان'
          };
        }
      } else if (item.type === 'wallex_crypto') {
        const sym = wallexSymbols?.[item.sourceKey];
        if (sym && sym.stats?.lastPrice) {
          const priceUSD = parseFloat(sym.stats.lastPrice);
          const ch = parseFloat(sym.stats['24h_ch'] || 0);

          let tomanStr = null;
          if (item.secondaryKey && wallexSymbols[item.secondaryKey]) {
            const tPrice = parseFloat(wallexSymbols[item.secondaryKey].stats?.lastPrice || 0);
            if (tPrice > 0) {
              tomanStr = Number(Math.round(tPrice)).toLocaleString('fa-IR') + ' ت';
            }
          }

          results[item.id] = {
            priceRaw: priceUSD,
            priceFormatted: priceUSD >= 1 
              ? Number(priceUSD.toFixed(2)).toLocaleString('en-US') 
              : priceUSD.toFixed(4),
            secondaryText: tomanStr,
            percent: (ch > 0 ? '+' : '') + ch.toFixed(2),
            isPositive: ch >= 0,
            unit: '$'
          };
        }
      } else if (item.type === 'wallex_crypto_toman') {
        const sym = wallexSymbols?.[item.sourceKey];
        if (sym && sym.stats?.lastPrice) {
          const priceToman = Math.round(parseFloat(sym.stats.lastPrice));
          const ch = parseFloat(sym.stats['24h_ch'] || 0);
          results[item.id] = {
            priceRaw: priceToman,
            priceFormatted: Number(priceToman).toLocaleString('fa-IR'),
            percent: (ch > 0 ? '+' : '') + ch.toFixed(2),
            isPositive: ch >= 0,
            unit: 'تومان'
          };
        }
      } else if (item.type?.startsWith('tgju')) {
        const cur = tgjuCurrent?.[item.sourceKey];
        if (cur && cur.p) {
          const pClean = parseFloat(String(cur.p).replace(/,/g, ''));
          const dp = parseFloat(cur.dp || 0);
          const isLow = cur.dt === 'low';
          const sign = isLow ? '-' : '+';

          let priceFormatted = cur.p;
          let unit = item.unit;

          // For rial currencies and gold, convert to Toman
          if (item.type === 'tgju_currency' || item.type === 'tgju_gold' || item.type === 'tgju_coin') {
            const pToman = Math.round(pClean / 10);
            priceFormatted = Number(pToman).toLocaleString('fa-IR');
            unit = 'تومان';
          } else if (item.type === 'tgju_forex') {
            priceFormatted = cur.p;
            unit = item.unit || '';
          }

          results[item.id] = {
            priceRaw: pClean,
            priceFormatted,
            percent: sign + dp.toFixed(2),
            isPositive: !isLow,
            unit
          };
        }
      }
    } catch (err) {
      console.warn(`Error parsing item ${item.id}:`, err);
    }
  }

  return results;
}
