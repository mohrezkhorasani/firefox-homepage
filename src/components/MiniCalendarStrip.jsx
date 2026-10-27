import React, { useState, useEffect } from 'react';
import { Maximize2, Calendar, CheckSquare, Clock, AlertCircle, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { getMiniStripDays, toPersianDigits, getGoogleConfig } from '../services/calendarService';

export default function MiniCalendarStrip({ onExpand, onOpenGoogleModal }) {
  const [days, setDays] = useState([]);
  const [pageOffset, setPageOffset] = useState(0);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [config, setConfig] = useState(getGoogleConfig());

  function reloadDays(offset = pageOffset) {
    setDays(getMiniStripDays(3, 5, offset)); // 9 days per page
    setConfig(getGoogleConfig());
  }

  useEffect(() => {
    reloadDays(pageOffset);
  }, [pageOffset]);

  useEffect(() => {
    const interval = setInterval(() => reloadDays(pageOffset), 60000);
    return () => clearInterval(interval);
  }, [pageOffset]);

  // Determine current display month and year
  const activeMonthName = days[Math.floor(days.length / 2)]?.monthName || days[0]?.monthName;
  const activeYear = days[Math.floor(days.length / 2)]?.jy || days[0]?.jy;

  return (
    <div className="relative flex flex-col items-center justify-center px-1 py-1 select-none" dir="rtl">
      {/* Top micro bar: Month title + Google Status + Pagination Nav + Expand Button */}
      <div className="flex items-center justify-between w-full mb-1.5 px-1 text-xs gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-200 text-[11px] bg-black/30 px-2 py-0.5 rounded-md border border-white/10 shrink-0">
            {activeMonthName} {activeYear}
          </span>

          {/* Pagination Controls (Next / Prev Page of days) */}
          <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 rounded-lg p-0.5" dir="rtl">
            <button
              onClick={() => setPageOffset((prev) => prev - 1)}
              className="p-1 hover:bg-white/10 text-gray-300 hover:text-white rounded transition"
              title="روزهای قبلی (عقب‌تر)"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            {pageOffset !== 0 && (
              <button
                onClick={() => setPageOffset(0)}
                className="px-1 py-0.5 text-[9px] font-bold text-cyan-300 hover:bg-white/10 rounded transition"
                title="بازگشت به امروز"
              >
                امروز
              </button>
            )}

            <button
              onClick={() => setPageOffset((prev) => prev + 1)}
              className="p-1 hover:bg-white/10 text-gray-300 hover:text-white rounded transition"
              title="روزهای بعدی (جلوتر)"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onOpenGoogleModal}
            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition shrink-0 ${
              config.connected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
            }`}
            title={config.connected ? `متصل به: ${config.email || 'گوگل کلندر'}` : 'اتصال به تقویم گوگل'}
          >
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">
              {config.connected ? 'گوگل فعال' : 'اتصال گوگل'}
            </span>
            {config.connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>
        </div>

        <button
          onClick={onExpand}
          className="flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 px-2 py-0.5 rounded-md transition shadow-sm shrink-0"
          title="مشاهده تقویم کامل در صفحه"
        >
          <Maximize2 className="w-3 h-3" />
          <span>مشاهده بیشتر</span>
        </button>
      </div>

      {/* Days Strip Tiles */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 pt-0.5 scrollbar-thin">
        {days.map((day, idx) => {
          const isFri = day.isFriday;
          const isHoli = day.isHoliday;
          const isTod = day.isToday;
          const hasGovEvents = day.officialEvents.length > 0;
          const hasGgEvents = day.googleEvents.length > 0;
          const hasTasks = day.userTasks.length > 0;
          const anyEvent = hasGovEvents || hasGgEvents || hasTasks;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={onExpand}
              className={`relative flex flex-col items-center justify-between w-10 sm:w-11 h-13 sm:h-14 p-1 rounded-xl bg-white text-gray-900 cursor-pointer shadow-sm hover:shadow-md transition-all duration-150 transform hover:-translate-y-0.5 ${
                isTod
                  ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900/60 bg-gradient-to-b from-cyan-50 to-white'
                  : 'border border-black/10 hover:bg-slate-50'
              }`}
            >
              {/* Day of Week */}
              <span
                className={`text-[10px] leading-tight font-medium ${
                  isHoli ? 'text-rose-600 font-bold' : 'text-gray-500'
                }`}
              >
                {day.weekdayShort}
              </span>

              {/* Day Number */}
              <span
                className={`text-sm sm:text-base leading-none font-black ${
                  isHoli ? 'text-rose-600' : 'text-gray-900'
                }`}
              >
                {toPersianDigits(day.jd)}
              </span>

              {/* Bottom Indicator row (Today label or Event icons) */}
              <div className="flex items-center justify-center gap-0.5 h-3">
                {isTod ? (
                  <span className="text-[8px] font-bold text-cyan-700 bg-cyan-100 px-1 rounded-sm leading-tight">
                    امروز
                  </span>
                ) : anyEvent ? (
                  <div className="flex items-center gap-0.5">
                    {hasGgEvents && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                        title="دارای ایونت گوگل"
                      />
                    )}
                    {hasGovEvents && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHoli ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        title="مناسبت تقویم"
                      />
                    )}
                    {hasTasks && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        title="دارای تسک شخصی"
                      />
                    )}
                  </div>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-transparent" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Floating Sticky Tooltip */}
      {hoveredDay && (
        <div
          className="absolute z-[999] top-full mt-2 w-72 sm:w-80 bg-slate-900/98 border border-white/20 rounded-xl p-3 shadow-2xl text-white backdrop-blur-md animate-fade-in pointer-events-none"
          style={{ right: '50%', transform: 'translateX(50%)' }}
        >
          {/* Tooltip Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{hoveredDay.weekdayName}</span>
                <span className={hoveredDay.isHoliday ? 'text-rose-400 font-black' : 'text-cyan-400'}>
                  {toPersianDigits(hoveredDay.jd)} {hoveredDay.monthName} {toPersianDigits(hoveredDay.jy)}
                </span>
                {hoveredDay.isToday && (
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 py-0.2 rounded font-normal">
                    امروز
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 font-mono" dir="ltr">
                {hoveredDay.gDateStr}
              </div>
            </div>
            {hoveredDay.isHoliday && (
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold">
                تعطیل
              </span>
            )}
          </div>

          {/* Events Content */}
          <div className="space-y-2 text-xs">
            {/* Official Persian Events */}
            {hoveredDay.officialEvents.length > 0 && (
              <div>
                <span className="text-[10px] text-amber-400 font-bold block mb-1">
                  مناسبت‌های رسمی:
                </span>
                <ul className="space-y-1">
                  {hoveredDay.officialEvents.map((evt, i) => (
                    <li
                      key={i}
                      className={`text-[11px] flex items-start gap-1.5 ${
                        evt.isHoliday ? 'text-rose-300 font-bold' : 'text-gray-200'
                      }`}
                    >
                      <span className="text-amber-400 text-xs">•</span>
                      <span>{evt.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Google Calendar Events */}
            {hoveredDay.googleEvents.length > 0 && (
              <div>
                <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  رویدادهای تقویم گوگل:
                </span>
                <ul className="space-y-1">
                  {hoveredDay.googleEvents.map((gevt, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-cyan-100 bg-cyan-950/30 border border-cyan-500/20 p-1.5 rounded-md flex items-center justify-between"
                    >
                      <span className="font-medium truncate">{gevt.title}</span>
                      {gevt.time && (
                        <span className="text-[10px] text-cyan-300 shrink-0 font-mono" dir="ltr">
                          {gevt.time}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* User Personal Tasks */}
            {hoveredDay.userTasks.length > 0 && (
              <div>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mb-1">
                  <CheckSquare className="w-3 h-3" />
                  وظایف و یادداشت‌ها:
                </span>
                <ul className="space-y-1">
                  {hoveredDay.userTasks.map((task, i) => (
                    <li
                      key={i}
                      className={`text-[11px] p-1.5 rounded-md flex items-center gap-1.5 ${
                        task.done
                          ? 'line-through text-gray-500 bg-white/5'
                          : 'text-emerald-100 bg-emerald-950/30 border border-emerald-500/20'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="truncate">{task.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* If no events */}
            {!hoveredDay.hasEvents && (
              <p className="text-[11px] text-gray-400 text-center py-1">
                رویداد خاصی برای این روز ثبت نشده است.
              </p>
            )}
          </div>

          <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-gray-400 text-center">
            کلیک برای مشاهده تقویم ماهانه
          </div>
        </div>
      )}
    </div>
  );
}
