import React, { useState, useEffect } from 'react';

export default function PrayerTimes() {
  const [times, setTimes] = useState(() => {
    const saved = localStorage.getItem('homepage_prayer_times');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!times);

  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        const today = new Date();
        const dateKey = today.toISOString().slice(0, 10);
        const cached = localStorage.getItem('homepage_prayer_cache_date');
        
        if (cached === dateKey && times) {
          return;
        }

        const res = await fetch('https://api.aladhan.com/v1/timings?latitude=34.64&longitude=50.87&method=7');
        const json = await res.json();
        if (json?.data?.timings) {
          const t = json.data.timings;
          const parsed = {
            fajr: t.Fajr,       // اذان صبح
            sunrise: t.Sunrise, // طلوع آفتاب
            dhuhr: t.Dhuhr,     // اذان ظهر
            sunset: t.Sunset,   // غروب آفتاب
            maghrib: t.Maghrib, // اذان مغرب
            midnight: t.Midnight// نیمه‌شب شرعی
          };
          setTimes(parsed);
          localStorage.setItem('homepage_prayer_times', JSON.stringify(parsed));
          localStorage.setItem('homepage_prayer_cache_date', dateKey);
        }
      } catch (e) {
        console.error('Error fetching prayer times:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchPrayerTimes();
  }, []);

  if (loading && !times) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 pt-2 border-t border-white/10">
        <span>اوقات شرعی قم: در حال دریافت...</span>
      </div>
    );
  }

  if (!times) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-300 mt-2 pt-2 border-t border-white/10">
      <span className="text-amber-400 font-semibold flex items-center gap-1">
        <i className="fas fa-mosque text-xs"></i>
        <span>اوقات شرعی قم:</span>
      </span>

      <span className="flex items-center gap-1">
        <span className="text-gray-400">اذان صبح:</span>
        <span className="font-mono text-white font-medium">{times.fajr}</span>
      </span>

      <span className="text-gray-600">•</span>

      <span className="flex items-center gap-1">
        <span className="text-gray-400">طلوع آفتاب:</span>
        <span className="font-mono text-white font-medium">{times.sunrise}</span>
      </span>

      <span className="text-gray-600">•</span>

      <span className="flex items-center gap-1">
        <span className="text-gray-400">اذان ظهر:</span>
        <span className="font-mono text-amber-300 font-medium">{times.dhuhr}</span>
      </span>

      <span className="text-gray-600">•</span>

      <span className="flex items-center gap-1">
        <span className="text-gray-400">غروب آفتاب:</span>
        <span className="font-mono text-white font-medium">{times.sunset}</span>
      </span>

      <span className="text-gray-600">•</span>

      <span className="flex items-center gap-1">
        <span className="text-gray-400">اذان مغرب:</span>
        <span className="font-mono text-amber-300 font-medium">{times.maghrib}</span>
      </span>

      <span className="text-gray-600">•</span>

      <span className="flex items-center gap-1">
        <span className="text-gray-400">نیمه‌شب شرعی:</span>
        <span className="font-mono text-white font-medium">{times.midnight}</span>
      </span>
    </div>
  );
}
