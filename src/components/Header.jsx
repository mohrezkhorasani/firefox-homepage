import React, { useState, useEffect } from 'react';
import TripleDate from './TripleDate';
import WeatherWidget from './WeatherWidget';
import PrayerTimes from './PrayerTimes';

export default function Header() {
  const [time, setTime] = useState('00:00:00');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTime(now.toLocaleTimeString('fa-IR'));
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass p-5 rounded-2xl max-w-7xl mx-auto mb-6 text-shadow border border-white/20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Clock & Dates */}
        <div className="text-center md:text-right">
          <h1 className="text-4xl font-bold tracking-wider font-mono text-white mb-1" id="clock" dir="ltr">
            {time}
          </h1>
          <TripleDate />
        </div>

        {/* Weather (7 days horizontal) */}
        <div className="flex items-center gap-6">
          <WeatherWidget />
        </div>
      </div>

      {/* Prayer Times Row for Qom */}
      <PrayerTimes />
    </header>
  );
}
