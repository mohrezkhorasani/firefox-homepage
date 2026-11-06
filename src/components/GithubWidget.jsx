import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw,
  Maximize2,
  Flame,
  GitCommit
} from 'lucide-react';
import GithubModal from './GithubModal';
import {
  DEFAULT_GITHUB_USERNAME,
  fetchAllGitHubData,
  formatRelativeTime,
  formatEventAction,
  formatPersianDateString
} from '../services/githubService';

const MINI_LEVEL_COLORS = [
  'bg-white/5 border border-white/5',
  'bg-emerald-950 border border-emerald-900',
  'bg-emerald-800 border border-emerald-700',
  'bg-emerald-600 border border-emerald-500',
  'bg-emerald-400 border border-emerald-300'
];

export default function GithubWidget() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const loadData = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const result = await fetchAllGitHubData(DEFAULT_GITHUB_USERNAME, force);
      setData(result);
    } catch (err) {
      console.error('Failed to load github data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const contributions = data?.contributions || { total: 0, contributions: [] };
  const dailyList = contributions.contributions || [];
  // Take last 14 weeks (98 days) for compact 14x7 mini heatmap
  const miniDays = dailyList.slice(-98);

  const latestEvent = data?.events?.[0];
  const latestEventInfo = latestEvent ? formatEventAction(latestEvent) : null;

  function handleSquareMouseEnter(e, day) {
    if (containerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const parentRect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top
      });
    }
    setHoveredDay(day);
  }

  function handleSquareMouseLeave() {
    setHoveredDay(null);
  }

  return (
    <>
      <div 
        ref={containerRef}
        onClick={() => setIsModalOpen(true)}
        className="flex flex-col gap-1.5 w-full bg-white/5 hover:bg-white/[0.08] p-2 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all select-none relative cursor-pointer group"
      >
        {/* Floating Tooltip attached to hovered square */}
        {hoveredDay && (
          <div 
            className="absolute z-50 px-2 py-1 rounded-lg bg-slate-950/95 border border-emerald-500/50 shadow-2xl text-[10px] text-white flex items-center gap-1.5 whitespace-nowrap pointer-events-none transform -translate-x-1/2 -translate-y-full mb-1 animate-fade-in"
            style={{ 
              left: Math.min(Math.max(tooltipPos.x, 50), 150), 
              top: tooltipPos.y - 4 
            }}
          >
            <span className="font-bold text-emerald-400">
              {hoveredDay.count === 0 ? 'بدون مشارکت' : `${hoveredDay.count} مشارکت`}
            </span>
            <span className="text-amber-300 font-medium">
              {formatPersianDateString(hoveredDay.date)}
            </span>
            {/* Small downward arrow */}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-emerald-500/50 transform rotate-45" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
            <i className="fab fa-github text-emerald-400 text-sm" />
            <span className="truncate max-w-[85px] font-mono text-[11px] text-slate-200">
              {DEFAULT_GITHUB_USERNAME}
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {contributions.total > 0 && (
              <span 
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold"
                title={`${contributions.total} مشارکت در سال گذشته`}
              >
                <Flame className="w-2.5 h-2.5 text-emerald-400" />
                <span>{contributions.total}</span>
              </span>
            )}

            <button
              onClick={() => loadData(true)}
              disabled={isLoading}
              className={`p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition ${
                isLoading ? 'animate-spin text-cyan-400' : ''
              }`}
              title="بروزرسانی داده‌های گیت‌هاب"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition"
              title="مشاهده تقویم و فعالیت‌های کامل"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Mini Contribution Heatmap Grid */}
        <div className="p-1.5 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center">
          {miniDays.length > 0 ? (
            <div 
              className="grid grid-flow-col gap-[2px] auto-cols-[8px] justify-center w-full"
              style={{ gridTemplateRows: 'repeat(7, 8px)' }}
              dir="ltr"
            >
              {miniDays.map((day, idx) => {
                const level = Math.min(Math.max(day.level || 0, 0), 4);
                const isHovered = hoveredDay?.date === day.date;
                return (
                  <div
                    key={idx}
                    onMouseEnter={(e) => handleSquareMouseEnter(e, day)}
                    onMouseLeave={handleSquareMouseLeave}
                    className={`w-[8px] h-[8px] rounded-[1.5px] transition-transform duration-100 ${
                      isHovered ? 'scale-150 ring-1 ring-white z-10' : ''
                    } ${MINI_LEVEL_COLORS[level]}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-10 flex items-center justify-center text-[10px] text-slate-500">
              {isLoading ? 'در حال دریافت...' : 'در انتظار دریافت تقویم'}
            </div>
          )}
        </div>

        {/* Bottom Info Pill: Dynamic on hover, or showing latest activity */}
        {hoveredDay ? (
          <div className="flex items-center justify-between px-1.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-[10px] transition-all animate-fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              <span className="font-bold text-emerald-300 truncate">
                {hoveredDay.count === 0 ? 'بدون مشارکت' : `${hoveredDay.count} مشارکت`}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] shrink-0 font-medium">
              <span className="text-amber-300 font-medium">{formatPersianDateString(hoveredDay.date)}</span>
              <span className="text-slate-400 font-mono dir-ltr">({hoveredDay.date})</span>
            </div>
          </div>
        ) : latestEventInfo ? (
          <div className="flex items-center justify-between px-1.5 py-1 rounded-md bg-black/30 border border-white/5 text-[10px]">
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <span className={`w-1.5 h-1.5 rounded-full ${latestEventInfo.color.replace('text-', 'bg-')} shrink-0`} />
              <span className="font-semibold text-slate-200 truncate">
                {latestEventInfo.title}
              </span>
            </div>
            <span className="text-slate-400 text-[9px] shrink-0 font-medium mr-1">
              {formatRelativeTime(latestEvent.created_at)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1.5 py-1 rounded-md bg-black/30 border border-white/5 text-[10px] text-slate-400">
            <span>فعالیت اخیر</span>
            <span className="text-[9px]">کلیک برای جزئیات</span>
          </div>
        )}
      </div>

      {/* Full Modal (Portaled directly to document.body, perfectly centered) */}
      <GithubModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={data}
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
      />
    </>
  );
}
