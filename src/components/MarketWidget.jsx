import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Sparkles, 
  Gem, 
  Smile, 
  RefreshCw,
  Activity,
  ExternalLink,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Check,
  Zap,
  Coins,
  Flame,
  Layers,
  Car,
  Droplet,
  Bitcoin
} from 'lucide-react';
import { MARKET_CATALOG, MARKET_CATEGORIES, DEFAULT_PINNED_MARKETS } from '../data/marketCatalog';
import { fetchAllMarketPrices } from '../services/marketDataService';

// Dynamic icon mapper
function renderMarketIcon(iconType, colorClass = 'text-white') {
  const iconProps = { className: `w-4 h-4 ${colorClass}` };
  switch (iconType) {
    case 'Bitcoin': return <Bitcoin {...iconProps} />;
    case 'TrendingUp': return <TrendingUp {...iconProps} />;
    case 'DollarSign': return <DollarSign {...iconProps} />;
    case 'Sparkles': return <Sparkles {...iconProps} />;
    case 'Gem': return <Gem {...iconProps} />;
    case 'Smile': return <Smile {...iconProps} />;
    case 'Coins': return <Coins {...iconProps} />;
    case 'Zap': return <Zap {...iconProps} />;
    case 'Flame': return <Flame {...iconProps} />;
    case 'Layers': return <Layers {...iconProps} />;
    case 'Car': return <Car {...iconProps} />;
    case 'Droplet': return <Droplet {...iconProps} />;
    default: return <Activity {...iconProps} />;
  }
}

export default function MarketWidget() {
  // Pinned items IDs
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_pinned_markets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PINNED_MARKETS;
  });

  // Cached market prices data
  const [marketPrices, setMarketPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_market_prices_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    return localStorage.getItem('homepage_market_time_v2') || '';
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTargetIndex, setEditingTargetIndex] = useState(null); // null = Add mode, number = Edit mode
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Save pinned IDs
  useEffect(() => {
    localStorage.setItem('homepage_pinned_markets_v2', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  // Catalog items corresponding to pinned IDs
  const pinnedCatalogItems = useMemo(() => {
    return pinnedIds
      .map((id) => MARKET_CATALOG.find((item) => item.id === id))
      .filter(Boolean);
  }, [pinnedIds]);

  // Fetch prices
  const updatePrices = async () => {
    if (pinnedCatalogItems.length === 0) return;
    setIsLoading(true);
    try {
      const freshData = await fetchAllMarketPrices(pinnedCatalogItems);
      setMarketPrices((prev) => {
        const merged = { ...prev, ...freshData };
        localStorage.setItem('homepage_market_prices_v2', JSON.stringify(merged));
        return merged;
      });

      const nowTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(nowTime);
      localStorage.setItem('homepage_market_time_v2', nowTime);
    } catch (e) {
      console.warn('Market fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updatePrices();
    const interval = setInterval(updatePrices, 45000); // 45 seconds refresh
    return () => clearInterval(interval);
  }, [pinnedIds]);

  // Modal Handlers
  function openAddModal() {
    setEditingTargetIndex(null);
    setSearchQuery('');
    setActiveCategory('all');
    setIsModalOpen(true);
  }

  function openEditModal(index) {
    setEditingTargetIndex(index);
    setSearchQuery('');
    setActiveCategory('all');
    setIsModalOpen(true);
  }

  function handleSelectAsset(catalogItem) {
    if (editingTargetIndex !== null) {
      // Replace existing item at index
      setPinnedIds((prev) => {
        const next = [...prev];
        next[editingTargetIndex] = catalogItem.id;
        return next;
      });
    } else {
      // Add new if not already present
      if (!pinnedIds.includes(catalogItem.id)) {
        setPinnedIds((prev) => [...prev, catalogItem.id]);
      }
    }
    setIsModalOpen(false);
  }

  function handleRemovePinned(index, e) {
    e.stopPropagation();
    if (pinnedIds.length <= 1) {
      alert('حداقل یک نماد مالی باید در ویجت باقی بماند.');
      return;
    }
    setPinnedIds((prev) => prev.filter((_, i) => i !== index));
  }

  // Filtered catalog for modal
  const filteredCatalog = useMemo(() => {
    let list = MARKET_CATALOG;
    if (activeCategory !== 'all') {
      list = list.filter((item) => item.category === activeCategory);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => 
      item.name.toLowerCase().includes(q) ||
      item.symbol.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q)
    );
  }, [searchQuery, activeCategory]);

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

        <div className="flex items-center gap-1.5">
          {lastUpdated && (
            <span className="text-[10px] text-gray-400 font-mono">
              {lastUpdated}
            </span>
          )}

          <button
            onClick={updatePrices}
            disabled={isLoading}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
            title="بروزرسانی نرخ‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition shadow-sm"
            title="افزودن نماد یا سهم جدید"
          >
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">افزودن نماد</span>
          </button>
        </div>
      </div>

      {/* Pinned Market Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {pinnedCatalogItems.map((item, index) => {
          const data = marketPrices[item.id] || {};
          const isPos = data.isPositive !== false;
          const isLarge = item.id === 'bourse' || item.id === 'bourse_equal';

          return (
            <div
              key={`${item.id}-${index}`}
              className={`bg-black/45 hover:bg-black/60 border border-white/10 p-3 rounded-xl transition flex flex-col justify-between group relative overflow-hidden ${
                isLarge ? 'sm:col-span-2' : ''
              }`}
            >
              {/* Top row: Icon, Name & Percent */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-lg ${item.iconBg || 'bg-white/10'} flex items-center justify-center shrink-0 border border-white/10`}>
                    {renderMarketIcon(item.iconType, item.iconColor)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-200 truncate flex items-center gap-1.5">
                      <span>{item.symbol}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-400 font-medium">
                        {item.categoryLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 truncate mt-0.5" title={item.name}>
                      {item.name}
                    </div>
                  </div>
                </div>

                {/* Percentage Badge & Edit/Remove triggers */}
                <div className="flex items-center gap-1 shrink-0">
                  {data.percent ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        isPos
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                      dir="ltr"
                    >
                      {data.percent}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-mono">--</span>
                  )}
                </div>
              </div>

              {/* Price & Unit Row */}
              <div className="flex items-baseline justify-between mt-1 pt-1.5 border-t border-white/5" dir="ltr">
                <span className={`text-base sm:text-lg font-black font-mono tracking-wide drop-shadow-sm ${
                  isPos ? 'text-white group-hover:text-emerald-300' : 'text-white group-hover:text-rose-300'
                } transition-colors`}>
                  {data.priceFormatted || '...'}
                </span>
                
                <div className="flex items-center gap-1.5">
                  {data.secondaryText && (
                    <span className="text-[10px] text-slate-400 font-mono" dir="rtl">
                      {data.secondaryText}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-gray-400 font-sans" dir="rtl">
                    {data.unit || item.unit}
                  </span>
                </div>
              </div>

              {/* Hover Actions Bar (Edit & Remove buttons) */}
              <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md px-1.5 py-1 rounded-lg border border-white/10 shadow-lg">
                <button
                  onClick={() => openEditModal(index)}
                  className="p-1 text-slate-300 hover:text-cyan-300 hover:bg-white/10 rounded transition"
                  title="تغییر این سهم / نماد"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleRemovePinned(index, e)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded transition"
                  title="حذف از پین‌ها"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Select Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl text-white flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingTargetIndex !== null ? 'تغییر سهم و نماد پین‌شده' : 'افزودن نماد مالی جدید'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    جستجو میان ارزهای دیجیتال، فارکس، بورس ایران، طلا و ارزهای آزاد
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="جستجوی نام یا نماد (مثلاً BTC, اتریوم, EUR/USD, طلا, فولاد, دلار...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-2xl pr-10 pl-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
              {MARKET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl transition font-medium whitespace-nowrap shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Assets List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCatalog.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-12">
                  نمادی با این عنوان یافت نشد.
                </p>
              ) : (
                filteredCatalog.map((item) => {
                  const isAlreadyPinned = pinnedIds.includes(item.id);
                  const isCurrentEditing = editingTargetIndex !== null && pinnedIds[editingTargetIndex] === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectAsset(item)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrentEditing
                          ? 'bg-emerald-950/40 border-emerald-500/50'
                          : isAlreadyPinned && editingTargetIndex === null
                          ? 'bg-white/5 border-white/10 opacity-70'
                          : 'glass-subtle border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl ${item.iconBg || 'bg-white/10'} flex items-center justify-center shrink-0 border border-white/10`}>
                          {renderMarketIcon(item.iconType, item.iconColor)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold font-mono text-white">
                              {item.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-medium">
                              {item.categoryLabel}
                            </span>
                            {isAlreadyPinned && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                پین‌شده
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 truncate mt-0.5">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
                        isCurrentEditing
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 text-slate-200 hover:bg-emerald-600 hover:text-white'
                      }`}>
                        {isCurrentEditing ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>فعلی</span>
                          </>
                        ) : (
                          <span>انتخاب</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>{filteredCatalog.length} نماد در این بخش</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
