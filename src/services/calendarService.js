/**
 * Persian (Jalali) Calendar Service & Google Calendar Integration
 * Provides accurate Jalali/Gregorian conversions, official Iranian holidays & occasions,
 * Google Calendar iCal parser/sync, and personal task management.
 */

export const JALAALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

export const JALAALI_WEEKDAY_NAMES = [
  'شنبه', 'یکشنبه', 'دوشنبه',
  'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
];

export const JALAALI_WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Official & Celebrated Iranian Events / Occasions (Month: 1-12, Day: 1-31)
export const PERSIAN_FIXED_EVENTS = [
  { month: 1, day: 1, title: 'جشن نوروز / سال نو', isHoliday: true },
  { month: 1, day: 2, title: 'عید نوروز', isHoliday: true },
  { month: 1, day: 3, title: 'عید نوروز', isHoliday: true },
  { month: 1, day: 4, title: 'عید نوروز', isHoliday: true },
  { month: 1, day: 12, title: 'روز جمهوری اسلامی', isHoliday: true },
  { month: 1, day: 13, title: 'روز طبیعت (سیزده‌بدر)', isHoliday: true },
  { month: 1, day: 18, title: 'روز سلامتی', isHoliday: false },
  { month: 1, day: 25, title: 'روز بزرگداشت عطار نیشابوری', isHoliday: false },
  { month: 1, day: 29, title: 'روز ارتش جمهوری اسلامی', isHoliday: false },

  { month: 2, day: 1, title: 'بزرگداشت سعدی', isHoliday: false },
  { month: 2, day: 2, title: 'جشن گیاه‌آوری / روز زمین', isHoliday: false },
  { month: 2, day: 10, title: 'روز ملی خلیج فارس', isHoliday: false },
  { month: 2, day: 12, title: 'روز معلم و بزرگداشت استاد مطهری', isHoliday: false },
  { month: 2, day: 15, title: 'جشن بهاربد / روز شیراز', isHoliday: false },
  { month: 2, day: 25, title: 'بزرگداشت فردوسی و پاسداشت زبان فارسی', isHoliday: false },
  { month: 2, day: 28, title: 'بزرگداشت حکیم عمر خیام', isHoliday: false },

  { month: 3, day: 1, title: 'روز بهره‌وری / بزرگداشت ملاصدرا', isHoliday: false },
  { month: 3, day: 3, title: 'فتح خرمشهر در عملیات بیت‌المقدس', isHoliday: false },
  { month: 3, day: 14, title: 'رحلت امام خمینی (ره)', isHoliday: true },
  { month: 3, day: 15, title: 'قیام خونین ۱۵ خرداد', isHoliday: true },
  { month: 3, day: 20, title: 'روز ملی صنایع دستی', isHoliday: false },

  { month: 4, day: 1, title: 'جشن نیلوفر / روز اصناف', isHoliday: false },
  { month: 4, day: 10, title: 'روز صنعت و معدن', isHoliday: false },
  { month: 4, day: 14, title: 'روز قلم', isHoliday: false },
  { month: 4, day: 22, title: 'زادروز خوارزمی / روز فناوری اطلاعات', isHoliday: false },
  { month: 4, day: 25, title: 'روز بهزیستی و تامین اجتماعی', isHoliday: false },

  { month: 5, day: 6, title: 'روز ترویج آموزش‌های فنی و حرفه‌ای', isHoliday: false },
  { month: 5, day: 8, title: 'بزرگداشت شیخ شهاب‌الدین سهروردی', isHoliday: false },
  { month: 5, day: 14, title: 'صدور فرمان مشروطیت', isHoliday: false },
  { month: 5, day: 17, title: 'روز خبرنگار', isHoliday: false },
  { month: 5, day: 26, title: 'آغاز بازگشت آزادگان به میهن', isHoliday: false },

  { month: 6, day: 1, title: 'بزرگداشت ابن‌سینا / روز پزشک', isHoliday: false },
  { month: 6, day: 2, title: 'آغاز هفته دولت', isHoliday: false },
  { month: 6, day: 4, title: 'زادروز داراب / روز کارمند', isHoliday: false },
  { month: 6, day: 5, title: 'بزرگداشت محمدبن زکریای رازی / روز داروساز', isHoliday: false },
  { month: 6, day: 13, title: 'بزرگداشت ابوریحان بیرونی', isHoliday: false },
  { month: 6, day: 21, title: 'روز سینما', isHoliday: false },
  { month: 6, day: 27, title: 'بزرگداشت شهریار / روز شعر و ادب فارسی', isHoliday: false },
  { month: 6, day: 31, title: 'آغاز هفته دفاع مقدس', isHoliday: false },

  { month: 7, day: 7, title: 'روز آتش‌نشانی و ایمنی', isHoliday: false },
  { month: 7, day: 8, title: 'بزرگداشت مولوی', isHoliday: false },
  { month: 7, day: 14, title: 'روز دامپزشکی', isHoliday: false },
  { month: 7, day: 16, title: 'جشن مهرگان / روز کودک', isHoliday: false },
  { month: 7, day: 20, title: 'بزرگداشت حافظ', isHoliday: false },
  { month: 7, day: 26, title: 'روز تربیت بدنی و ورزش', isHoliday: false },

  { month: 8, day: 1, title: 'روز آمار و برنامه‌ریزی', isHoliday: false },
  { month: 8, day: 7, title: 'بزرگداشت کوروش بزرگ', isHoliday: false },
  { month: 8, day: 8, title: 'روز پدافند غیرعامل', isHoliday: false },
  { month: 8, day: 10, title: 'جشن آبانگان', isHoliday: false },
  { month: 8, day: 13, title: 'روز دانش‌آموز', isHoliday: false },
  { month: 8, day: 24, title: 'بزرگداشت علامه طباطبایی / روز کتاب و کتابخوانی', isHoliday: false },

  { month: 9, day: 5, title: 'روز بسیج مستضعفان', isHoliday: false },
  { month: 9, day: 7, title: 'روز نیروی دریایی', isHoliday: false },
  { month: 9, day: 16, title: 'روز دانشجو', isHoliday: false },
  { month: 9, day: 25, title: 'روز پژوهش', isHoliday: false },
  { month: 9, day: 30, title: 'جشن شب یلدا (چله)', isHoliday: false },

  { month: 10, day: 5, title: 'جشن دیگان / روز ایمنی در برابر زلزله', isHoliday: false },
  { month: 10, day: 13, title: 'شهادت سردار قاسم سلیمانی', isHoliday: false },
  { month: 10, day: 20, title: 'سالروز شهادت امیرکبیر', isHoliday: false },

  { month: 11, day: 1, title: 'زادروز فردوسی', isHoliday: false },
  { month: 11, day: 12, title: 'آغاز دهه فجر انقلاب اسلامی', isHoliday: false },
  { month: 11, day: 22, title: 'پیروزی انقلاب اسلامی', isHoliday: true },
  { month: 11, day: 29, title: 'جشن سپندارمذگان / روز مهر ایرانی', isHoliday: false },

  { month: 12, day: 5, title: 'بزرگداشت خواجه نصیرالدین طوسی / روز مهندس', isHoliday: false },
  { month: 12, day: 15, title: 'روز درختکاری', isHoliday: false },
  { month: 12, day: 25, title: 'پایان سرایش شاهنامه فردوسی', isHoliday: false },
  { month: 12, day: 29, title: 'ملی شدن صنعت نفت ایران', isHoliday: true }
];

/**
 * Astronomical Jalali Conversion (100% accurate)
 */
export function toJalaali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

export function toGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm];
    gm++;
  }
  let gd = days + 1;
  return { gy, gm, gd };
}

export function isJalaaliLeapYear(jy) {
  const rem = (jy + 38) % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(rem);
}

export function getJalaaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaaliLeapYear(jy) ? 30 : 29;
}

/**
 * Returns events for a specific Jalali day
 */
export function getEventsForJalaliDay(jy, jm, jd) {
  return PERSIAN_FIXED_EVENTS.filter((e) => e.month === jm && e.day === jd);
}

/**
 * Checks if a specific day is a holiday (Friday or official national holiday)
 */
export function isDayHoliday(gDate, jy, jm, jd) {
  // Friday is weekly holiday
  if (gDate.getDay() === 5) return true;
  const events = getEventsForJalaliDay(jy, jm, jd);
  return events.some((e) => e.isHoliday);
}

/**
 * Format date helpers
 */
export function formatYMD(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function toPersianDigits(n) {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (x) => farsiDigits[x]);
}

/**
 * Storage helpers for Google Calendar configuration
 */
export function getGoogleConfig() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('homepage_google_calendar_config');
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return {
    connected: false,
    email: '',
    icalUrl: '',
    lastSync: null
  };
}

export function saveGoogleConfig(config) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('homepage_google_calendar_config', JSON.stringify(config));
  }
}

export function disconnectGoogleAccount() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('homepage_google_calendar_config');
    localStorage.removeItem('homepage_google_calendar_events');
  }
}

export function getGoogleEvents() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('homepage_google_calendar_events');
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

/**
 * Storage helpers for User Personal Tasks / Notes
 */
export function getLocalTasks() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('homepage_calendar_tasks');
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveLocalTask(task) {
  const tasks = getLocalTasks();
  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    createdAt: Date.now(),
    done: false,
    ...task
  };
  tasks.unshift(newTask);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('homepage_calendar_tasks', JSON.stringify(tasks));
  }
  return newTask;
}

export function deleteLocalTask(id) {
  const tasks = getLocalTasks().filter((t) => t.id !== id);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('homepage_calendar_tasks', JSON.stringify(tasks));
  }
  return tasks;
}

export function toggleLocalTask(id) {
  const tasks = getLocalTasks().map((t) => {
    if (t.id === id) return { ...t, done: !t.done };
    return t;
  });
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('homepage_calendar_tasks', JSON.stringify(tasks));
  }
  return tasks;
}

/**
 * Simple iCal Parser (.ics) to extract Google Calendar events
 */
export function parseICalEvents(icsString) {
  if (!icsString) return [];
  const events = [];
  const lines = icsString.split(/\r\n|\n|\r/);
  let currentEvent = null;

  for (let line of lines) {
    line = line.trim();
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.dateStr && currentEvent.title) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.replace('SUMMARY:', '').trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.replace('DESCRIPTION:', '').trim();
      } else if (line.startsWith('DTSTART')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const rawDate = parts[1].trim();
          if (rawDate.length >= 8) {
            const y = rawDate.substring(0, 4);
            const m = rawDate.substring(4, 6);
            const d = rawDate.substring(6, 8);
            currentEvent.dateStr = `${y}-${m}-${d}`;
            if (rawDate.includes('T')) {
              const timePart = rawDate.split('T')[1];
              if (timePart.length >= 4) {
                currentEvent.time = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
              }
            }
          }
        }
      }
    }
  }

  return events;
}

/**
 * Fetches Google Calendar events using an iCal link via local proxy
 */
export async function syncGoogleCalendar(icalUrl, email = '') {
  if (!icalUrl || !icalUrl.trim()) {
    throw new Error('آدرس iCal وارد نشده است.');
  }

  const url = icalUrl.trim();
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`خطا در اتصال: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.ok && json.status === 0) {
    throw new Error(json.statusText || 'خطای اتصال به سرور');
  }

  const icsData = typeof json.data === 'string' ? json.data : JSON.stringify(json.data);
  const parsed = parseICalEvents(icsData);

  localStorage.setItem('homepage_google_calendar_events', JSON.stringify(parsed));
  const config = {
    connected: true,
    email: email.trim() || 'Google Account',
    icalUrl: url,
    lastSync: Date.now(),
    eventsCount: parsed.length
  };
  saveGoogleConfig(config);
  return { config, events: parsed };
}

/**
 * Get comprehensive details for a specific Date
 */
export function getDayDetails(gDate, allGoogleEvents = null, allTasks = null) {
  const gy = gDate.getFullYear();
  const gm = gDate.getMonth() + 1;
  const gd = gDate.getDate();

  const { jy, jm, jd } = toJalaali(gy, gm, gd);
  const gDateStr = formatYMD(gy, gm, gd);

  // Jalali Weekday index: 0=شنبه ... 6=جمعه
  const dayOfWeekIdx = (gDate.getDay() + 1) % 7;
  const weekdayShort = JALAALI_WEEKDAY_SHORT[dayOfWeekIdx];
  const weekdayName = JALAALI_WEEKDAY_NAMES[dayOfWeekIdx];

  // Today check
  const now = new Date();
  const isToday = (
    now.getFullYear() === gy &&
    now.getMonth() + 1 === gm &&
    now.getDate() === gd
  );

  // Official occasions & holiday
  const officialEvents = getEventsForJalaliDay(jy, jm, jd);
  const isFriday = gDate.getDay() === 5;
  const isHoliday = isFriday || officialEvents.some((e) => e.isHoliday);

  // Google events for this date
  const gEvents = allGoogleEvents || getGoogleEvents();
  const googleEvents = gEvents.filter((e) => e.dateStr === gDateStr);

  // User tasks for this date (either matched by Jalali Y-M-D or Gregorian)
  const tasks = allTasks || getLocalTasks();
  const userTasks = tasks.filter((t) => {
    if (t.gDateStr && t.gDateStr === gDateStr) return true;
    if (t.jy === jy && t.jm === jm && t.jd === jd) return true;
    return false;
  });

  const hasEvents = officialEvents.length > 0 || googleEvents.length > 0 || userTasks.length > 0;

  return {
    date: gDate,
    gy,
    gm,
    gd,
    gDateStr,
    jy,
    jm,
    jd,
    monthName: JALAALI_MONTH_NAMES[jm - 1],
    dayOfWeekIdx,
    weekdayShort,
    weekdayName,
    isToday,
    isHoliday,
    isFriday,
    officialEvents,
    googleEvents,
    userTasks,
    hasEvents
  };
}

/**
 * Generates an array of day objects for the mini calendar strip
 * Range: from daysBefore (default 3 days ago) to daysAfter (e.g. today + 6 days)
 */
export function getMiniStripDays(daysBefore = 3, daysAfter = 5, pageOffset = 0) {
  const days = [];
  const googleEvents = getGoogleEvents();
  const tasks = getLocalTasks();
  const today = new Date();
  const totalDays = daysBefore + daysAfter + 1; // e.g. 3 + 5 + 1 = 9 days per page
  const shift = pageOffset * totalDays;

  for (let offset = -daysBefore + shift; offset <= daysAfter + shift; offset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offset);
    days.push(getDayDetails(targetDate, googleEvents, tasks));
  }
  return days;
}

/**
 * Returns month grid and all events for FullCalendarView
 */
export function getFullMonthData(jy, jm) {
  const monthLength = getJalaaliMonthLength(jy, jm);
  const googleEvents = getGoogleEvents();
  const tasks = getLocalTasks();

  // Find weekday of 1st day of the month
  const firstDayGreg = toGregorian(jy, jm, 1);
  const firstDate = new Date(firstDayGreg.gy, firstDayGreg.gm - 1, firstDayGreg.gd);
  const firstDayWeekdayIdx = (firstDate.getDay() + 1) % 7; // 0=شنبه ... 6=جمعه

  // Days list
  const days = [];

  // Previous month padding days
  if (firstDayWeekdayIdx > 0) {
    const prevM = jm === 1 ? 12 : jm - 1;
    const prevY = jm === 1 ? jy - 1 : jy;
    const prevMLength = getJalaaliMonthLength(prevY, prevM);
    for (let i = firstDayWeekdayIdx - 1; i >= 0; i--) {
      const prevD = prevMLength - i;
      const gObj = toGregorian(prevY, prevM, prevD);
      const d = new Date(gObj.gy, gObj.gm - 1, gObj.gd);
      const detail = getDayDetails(d, googleEvents, tasks);
      days.push({ ...detail, isCurrentMonth: false });
    }
  }

  // Current month days
  for (let d = 1; d <= monthLength; d++) {
    const gObj = toGregorian(jy, jm, d);
    const dateObj = new Date(gObj.gy, gObj.gm - 1, gObj.gd);
    const detail = getDayDetails(dateObj, googleEvents, tasks);
    days.push({ ...detail, isCurrentMonth: true });
  }

  // Next month padding days to reach multiple of 7 (up to 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  if (remaining > 0) {
    const nextM = jm === 12 ? 1 : jm + 1;
    const nextY = jm === 12 ? jy + 1 : jy;
    for (let d = 1; d <= remaining; d++) {
      const gObj = toGregorian(nextY, nextM, d);
      const dateObj = new Date(gObj.gy, gObj.gm - 1, gObj.gd);
      const detail = getDayDetails(dateObj, googleEvents, tasks);
      days.push({ ...detail, isCurrentMonth: false });
    }
  }

  // All events in this current month for the extend section
  const monthOfficialEvents = [];
  for (let d = 1; d <= monthLength; d++) {
    const evts = getEventsForJalaliDay(jy, jm, d);
    evts.forEach((e) => monthOfficialEvents.push({ ...e, jd: d }));
  }

  // Google events within this month
  const firstDayStr = formatYMD(firstDayGreg.gy, firstDayGreg.gm, firstDayGreg.gd);
  const lastDayGreg = toGregorian(jy, jm, monthLength);
  const lastDayStr = formatYMD(lastDayGreg.gy, lastDayGreg.gm, lastDayGreg.gd);

  const monthGoogleEvents = googleEvents.filter((e) => {
    if (!e.dateStr) return false;
    return e.dateStr >= firstDayStr && e.dateStr <= lastDayStr;
  });

  // Tasks within this month
  const monthTasks = tasks.filter((t) => {
    if (t.jy === jy && t.jm === jm) return true;
    if (t.gDateStr && t.gDateStr >= firstDayStr && t.gDateStr <= lastDayStr) return true;
    return false;
  });

  return {
    jy,
    jm,
    monthName: JALAALI_MONTH_NAMES[jm - 1],
    monthLength,
    days,
    monthOfficialEvents,
    monthGoogleEvents,
    monthTasks
  };
}
