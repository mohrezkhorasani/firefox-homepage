import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  X,
  Calendar,
  Clock,
  CheckSquare,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import {
  getFullMonthData,
  toJalaali,
  toGregorian,
  toPersianDigits,
  JALAALI_WEEKDAY_NAMES,
  JALAALI_MONTH_NAMES,
  getGoogleConfig,
  saveLocalTask,
  deleteLocalTask,
  toggleLocalTask
} from '../services/calendarService';
import GoogleAccountModal from './GoogleAccountModal';

export default function FullCalendarView({ onClose }) {
  const todayDate = new Date();
  const currentJalaali = toJalaali(
    todayDate.getFullYear(),
    todayDate.getMonth() + 1,
    todayDate.getDate()
  );

  const [viewYear, setViewYear] = useState(currentJalaali.jy);
  const [viewMonth, setViewMonth] = useState(currentJalaali.jm);
  const [monthData, setMonthData] = useState(null);
  const [isExtended, setIsExtended] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleConfig, setGoogleConfig] = useState(getGoogleConfig());

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDay, setNewTaskDay] = useState(currentJalaali.jd);

  function refreshMonth() {
    const data = getFullMonthData(viewYear, viewMonth);
    setMonthData(data);
    setGoogleConfig(getGoogleConfig());
  }

  useEffect(() => {
    refreshMonth();
  }, [viewYear, viewMonth]);

  // Navigation handlers
  function handlePrevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handlePrevYear() {
    setViewYear((y) => y - 1);
  }

  function handleNextYear() {
    setViewYear((y) => y + 1);
  }

  function handleGoToday() {
    setViewYear(currentJalaali.jy);
    setViewMonth(currentJalaali.jm);
  }

  function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const gObj = toGregorian(viewYear, viewMonth, Number(newTaskDay));
    const mm = String(gObj.gm).padStart(2, '0');
    const dd = String(gObj.gd).padStart(2, '0');
    const gDateStr = `${gObj.gy}-${mm}-${dd}`;

    saveLocalTask({
      title: newTaskTitle.trim(),
      jy: viewYear,
      jm: viewMonth,
      jd: Number(newTaskDay),
      gDateStr
    });

    setNewTaskTitle('');
    refreshMonth();
  }

  function handleDeleteTask(id) {
    deleteLocalTask(id);
    refreshMonth();
  }

  function handleToggleTask(id) {
    toggleLocalTask(id);
    refreshMonth();
  }

  if (!monthData) return null;

  const totalEventsCount =
    monthData.monthOfficialEvents.length +
    monthData.monthGoogleEvents.length +
    monthData.monthTasks.length;

  return (
    <div className="w-full text-white animate-fade-in select-none" dir="rtl">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        {/* Right (RTL): Month & Year Title with Navigators */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 border border-white/15 rounded-xl p-1">
            <button
              onClick={handleNextYear}
              className="p-1 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition"
              title="سال بعد"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition"
              title="ماه بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="font-bold text-base sm:text-lg text-white px-3 min-w-[130px] text-center">
              {monthData.monthName} {toPersianDigits(monthData.jy)}
            </span>

            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition"
              title="ماه قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrevYear}
              className="p-1 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition"
              title="سال قبل"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleGoToday}
            className="flex items-center gap-1 text-xs px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-cyan-300 transition"
            title="رفتن به ماه جاری"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>امروز</span>
          </button>
        </div>

        {/* Left (RTL): Google Account Connection + Close Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGoogleModalOpen(true)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition ${
              googleConfig.connected
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-white/5 text-gray-300 border-white/15 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>{googleConfig.connected ? 'حساب گوگل متصل است' : 'اتصال به تقویم گوگل'}</span>
            {googleConfig.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl transition"
            title="بستن تقویم و بازگشت به ساعت و هواشناسی"
          >
            <X className="w-4 h-4" />
            <span>بستن</span>
          </button>
        </div>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-xs font-bold text-gray-300">
        {JALAALI_WEEKDAY_NAMES.map((name, i) => (
          <div
            key={i}
            className={`py-1.5 rounded-lg bg-black/20 ${
              i === 6 ? 'text-rose-400 bg-rose-950/20' : ''
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* 7-Columns Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {monthData.days.map((day, idx) => {
          const isFri = day.isFriday;
          const isHoli = day.isHoliday;
          const isTod = day.isToday;
          const isCurM = day.isCurrentMonth;
          const isSel = selectedDay && selectedDay.gDateStr === day.gDateStr;

          return (
            <div
              key={idx}
              onClick={() => setSelectedDay(day)}
              className={`min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-150 relative ${
                !isCurM
                  ? 'bg-white/20 text-gray-400 border border-white/5 opacity-50 hover:opacity-75'
                  : 'bg-white text-gray-900 border border-black/10 hover:shadow-lg'
              } ${
                isTod
                  ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900 bg-gradient-to-b from-cyan-50 to-white shadow-cyan-500/20'
                  : ''
              } ${isSel ? 'border-2 border-indigo-600 bg-indigo-50/90' : ''}`}
            >
              {/* Day Header: Day Number + Today / Holiday badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm sm:text-base font-black ${
                    !isCurM
                      ? 'text-gray-400'
                      : isHoli
                      ? 'text-rose-600'
                      : 'text-gray-900'
                  }`}
                >
                  {toPersianDigits(day.jd)}
                </span>

                <div className="flex items-center gap-1">
                  {isTod && (
                    <span className="text-[9px] font-bold text-cyan-800 bg-cyan-100 px-1 py-0.2 rounded">
                      امروز
                    </span>
                  )}
                  {isCurM && isHoli && !isTod && (
                    <span className="text-[8px] font-bold text-rose-700 bg-rose-100 px-1 py-0.2 rounded">
                      تعطیل
                    </span>
                  )}
                </div>
              </div>

              {/* Day Events Preview inside Card */}
              <div className="space-y-0.5 mt-1 overflow-hidden">
                {/* Official Occasions */}
                {day.officialEvents.slice(0, 1).map((e, ei) => (
                  <div
                    key={ei}
                    className={`text-[9px] sm:text-[10px] leading-tight truncate px-1 py-0.5 rounded font-medium ${
                      e.isHoliday
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                    title={e.title}
                  >
                    {e.title}
                  </div>
                ))}

                {/* Google Calendar Events */}
                {day.googleEvents.slice(0, 1).map((ge, gi) => (
                  <div
                    key={gi}
                    className="text-[9px] sm:text-[10px] leading-tight truncate px-1 py-0.5 rounded bg-blue-100 text-blue-900 font-medium flex items-center gap-0.5"
                    title={ge.title}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="truncate">{ge.title}</span>
                  </div>
                ))}

                {/* User Personal Tasks */}
                {day.userTasks.slice(0, 1).map((ut, ui) => (
                  <div
                    key={ui}
                    className={`text-[9px] sm:text-[10px] leading-tight truncate px-1 py-0.5 rounded font-medium flex items-center gap-0.5 ${
                      ut.done
                        ? 'bg-gray-100 text-gray-500 line-through'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                    title={ut.title}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="truncate">{ut.title}</span>
                  </div>
                ))}

                {/* Count badge if more events exist */}
                {(day.officialEvents.length + day.googleEvents.length + day.userTasks.length > 2) && (
                  <div className="text-[8px] text-gray-500 text-left font-mono">
                    +{day.officialEvents.length + day.googleEvents.length + day.userTasks.length - 2} مورد دیگر
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Floating Card if clicked */}
      {selectedDay && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/95 border border-white/20 text-white shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-cyan-400">
                جزئیات {selectedDay.weekdayName}، {toPersianDigits(selectedDay.jd)}{' '}
                {selectedDay.monthName} {toPersianDigits(selectedDay.jy)}
              </span>
              <span className="text-xs text-gray-400 font-mono" dir="ltr">
                ({selectedDay.gDateStr})
              </span>
              {selectedDay.isHoliday && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold">
                  تعطیل
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="بستن جزئیات روز"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Official */}
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
              <span className="font-bold text-amber-400 block mb-1.5">مناسبت‌های رسمی:</span>
              {selectedDay.officialEvents.length === 0 ? (
                <span className="text-gray-400 text-[11px]">مناسبتی ثبت نشده است.</span>
              ) : (
                <ul className="space-y-1">
                  {selectedDay.officialEvents.map((e, i) => (
                    <li
                      key={i}
                      className={`text-[11px] ${
                        e.isHoliday ? 'text-rose-300 font-bold' : 'text-gray-200'
                      }`}
                    >
                      • {e.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Google */}
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
              <span className="font-bold text-cyan-400 block mb-1.5">تقویم گوگل:</span>
              {selectedDay.googleEvents.length === 0 ? (
                <span className="text-gray-400 text-[11px]">رویدادی برای این روز وجود ندارد.</span>
              ) : (
                <ul className="space-y-1">
                  {selectedDay.googleEvents.map((ge, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-cyan-100 flex items-center justify-between"
                    >
                      <span>• {ge.title}</span>
                      {ge.time && <span className="font-mono text-cyan-300">{ge.time}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* User tasks */}
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
              <span className="font-bold text-emerald-400 block mb-1.5">وظایف شخصی:</span>
              {selectedDay.userTasks.length === 0 ? (
                <span className="text-gray-400 text-[11px]">وظیفه‌ای اضافه نشده است.</span>
              ) : (
                <ul className="space-y-1">
                  {selectedDay.userTasks.map((t, i) => (
                    <li
                      key={i}
                      className="text-[11px] flex items-center justify-between gap-1 group"
                    >
                      <button
                        onClick={() => handleToggleTask(t.id)}
                        className={`text-right truncate ${
                          t.done ? 'line-through text-gray-500' : 'text-emerald-200'
                        }`}
                      >
                        ✓ {t.title}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="text-gray-500 hover:text-rose-400 transition"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Extend Accordion Button (رویدادها و وظایف این ماه) */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center">
        <button
          onClick={() => setIsExtended(!isExtended)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-xs font-semibold text-cyan-300 transition shadow-sm"
        >
          <span>
            {isExtended
              ? 'بستن لیست رویدادها و وظایف این ماه'
              : `رویدادها و وظایف این ماه (${toPersianDigits(totalEventsCount)} رویداد)`}
          </span>
          {isExtended ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Extended Section: Content Area */}
        {isExtended && (
          <div className="w-full mt-4 p-4 rounded-xl bg-slate-900/90 border border-white/15 space-y-5 animate-fade-in">
            {/* Quick Task Add Form */}
            <form
              onSubmit={handleAddTask}
              className="p-3 bg-black/30 border border-white/10 rounded-xl flex flex-wrap items-center gap-2"
            >
              <span className="text-xs font-bold text-gray-300">افزودن یادداشت / تسک برای این ماه:</span>
              <div className="flex items-center gap-1 text-xs">
                <span>روز:</span>
                <select
                  value={newTaskDay}
                  onChange={(e) => setNewTaskDay(Number(e.target.value))}
                  className="bg-slate-800 border border-white/20 rounded-lg px-2 py-1 text-xs text-white"
                >
                  {Array.from({ length: monthData.monthLength }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {toPersianDigits(d)} {monthData.monthName}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="عنوان کار یا رویداد..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 min-w-[200px] bg-slate-800 border border-white/20 rounded-lg px-3 py-1 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1 bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-xs font-bold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Section 1: Official Holidays & Events in this Month */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <h4 className="text-xs font-bold text-amber-400">مناسبت‌ها و تعطیلات رسمی</h4>
                  <span className="text-[10px] text-gray-400">
                    {toPersianDigits(monthData.monthOfficialEvents.length)} مورد
                  </span>
                </div>
                {monthData.monthOfficialEvents.length === 0 ? (
                  <p className="text-[11px] text-gray-400">مناسبتی برای این ماه ثبت نشده است.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {monthData.monthOfficialEvents.map((evt, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                          evt.isHoliday
                            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold'
                            : 'bg-white/5 border border-white/5 text-gray-200'
                        }`}
                      >
                        <span>{evt.title}</span>
                        <span className="text-[11px] opacity-80 shrink-0">
                          {toPersianDigits(evt.jd)} {monthData.monthName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Google Calendar Events in this Month */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <h4 className="text-xs font-bold text-cyan-400">رویدادهای تقویم گوگل</h4>
                  <span className="text-[10px] text-gray-400">
                    {toPersianDigits(monthData.monthGoogleEvents.length)} مورد
                  </span>
                </div>
                {monthData.monthGoogleEvents.length === 0 ? (
                  <div className="p-3 bg-white/5 rounded-lg text-center">
                    <p className="text-[11px] text-gray-400 mb-2">
                      {googleConfig.connected
                        ? 'رویدادی برای این ماه در تقویم گوگل یافت نشد.'
                        : 'تقویم گوگل متصل نیست.'}
                    </p>
                    <button
                      onClick={() => setIsGoogleModalOpen(true)}
                      className="text-[11px] text-cyan-400 underline hover:text-cyan-300"
                    >
                      {googleConfig.connected ? 'بروزرسانی تقویم گوگل' : 'اتصال تقویم گوگل'}
                    </button>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {monthData.monthGoogleEvents.map((ge, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg text-xs bg-cyan-950/40 border border-cyan-500/20 text-cyan-100 flex items-center justify-between"
                      >
                        <div className="truncate pr-1">
                          <p className="font-semibold truncate">{ge.title}</p>
                          {ge.time && (
                            <span className="text-[10px] text-cyan-400 font-mono" dir="ltr">
                              ساعت: {ge.time}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono" dir="ltr">
                          {ge.dateStr}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: User Personal Tasks in this Month */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                  <h4 className="text-xs font-bold text-emerald-400">وظایف و یادداشت‌های شخصی</h4>
                  <span className="text-[10px] text-gray-400">
                    {toPersianDigits(monthData.monthTasks.length)} مورد
                  </span>
                </div>
                {monthData.monthTasks.length === 0 ? (
                  <p className="text-[11px] text-gray-400">وظیفه‌ای برای این ماه ثبت نشده است.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {monthData.monthTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2 rounded-lg text-xs bg-emerald-950/30 border border-emerald-500/20 text-emerald-100 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 truncate">
                          <input
                            type="checkbox"
                            checked={t.done || false}
                            onChange={() => handleToggleTask(t.id)}
                            className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                          <span
                            className={`truncate ${
                              t.done ? 'line-through text-gray-500' : 'text-emerald-100 font-medium'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-400">
                            {toPersianDigits(t.jd)} {monthData.monthName}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="text-gray-500 hover:text-rose-400 transition"
                            title="حذف تسک"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Google Account Modal Dialog */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onUpdated={() => refreshMonth()}
      />
    </div>
  );
}
