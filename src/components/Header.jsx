import React, { useState, useEffect } from 'react';
import TripleDate from './TripleDate';
import WeatherWidget from './WeatherWidget';
import PrayerTimes from './PrayerTimes';
import MiniCalendarStrip from './MiniCalendarStrip';
import FullCalendarView from './FullCalendarView';
import GoogleAccountModal from './GoogleAccountModal';

export default function Header() {
  const [time, setTime] = useState('00:00:00');
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

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
    <header className="glass p-5 rounded-2xl w-full mb-6 text-shadow border border-white/20 transition-all duration-300 relative z-30">
      {isCalendarExpanded ? (
        <FullCalendarView onClose={() => setIsCalendarExpanded(false)} />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Clock, Mini Calendar Strip & TripleDate */}
            <div className="flex flex-col items-center lg:items-start shrink-0">
              {/* Row with Clock on right (in RTL) and MiniCalendarStrip directly to its left */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <h1 className="text-4xl font-bold tracking-wider font-mono text-white mb-0 shrink-0" id="clock" dir="ltr">
                  {time}
                </h1>

                {/* Calendar strip placed directly to the left of clock & above TripleDate */}
                <div className="flex items-center">
                  <MiniCalendarStrip
                    onExpand={() => setIsCalendarExpanded(true)}
                    onOpenGoogleModal={() => setIsGoogleModalOpen(true)}
                  />
                </div>
              </div>

              {/* TripleDate directly below Clock & Calendar */}
              <TripleDate />
            </div>

            {/* Weather (7 days horizontal) */}
            <div className="flex items-center gap-6 shrink-0">
              <WeatherWidget />
            </div>
          </div>

          {/* Prayer Times Row for Qom */}
          <PrayerTimes />
        </>
      )}

      {/* Google Account Modal Dialog */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </header>
  );
}
