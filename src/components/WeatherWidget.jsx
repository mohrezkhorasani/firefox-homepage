import React, { useState, useEffect } from 'react';
import { 
  CloudSun, Sun, CloudRain, Cloud, CloudLightning, 
  Snowflake, Wind, MapPin
} from 'lucide-react';

const CITY_PRESETS = [
  { name: 'قم', lat: 34.64, lon: 50.87 },
  { name: 'تهران', lat: 35.68, lon: 51.41 },
  { name: 'مشهد', lat: 36.30, lon: 59.60 },
  { name: 'اصفهان', lat: 32.65, lon: 51.67 },
  { name: 'شیراز', lat: 29.59, lon: 52.58 }
];

function getWeatherIcon(code) {
  if (code === 0) return { icon: Sun, color: 'text-yellow-400', label: 'آفتابی' };
  if (code === 1 || code === 2) return { icon: CloudSun, color: 'text-yellow-300', label: 'نیمه‌ابری' };
  if (code === 3) return { icon: Cloud, color: 'text-gray-300', label: 'ابری' };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { icon: CloudRain, color: 'text-cyan-400', label: 'بارانی' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: Snowflake, color: 'text-blue-200', label: 'برفی' };
  if ([95, 96, 99].includes(code)) return { icon: CloudLightning, color: 'text-purple-400', label: 'رعدوبرق' };
  return { icon: CloudSun, color: 'text-yellow-300', label: 'نیمه‌ابری' };
}

export default function WeatherWidget() {
  const [city, setCity] = useState(() => {
    const saved = localStorage.getItem('homepage_city');
    return saved ? JSON.parse(saved) : CITY_PRESETS[0];
  });
  
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        setWeatherData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [city]);

  const currentTemp = weatherData?.current_weather?.temperature ?? '--';
  const currentCode = weatherData?.current_weather?.weathercode ?? 1;
  const currentInfo = getWeatherIcon(currentCode);
  const CurrentIcon = currentInfo.icon;

  const dailyTimes = (weatherData?.daily?.time || []).slice(0, 7);
  const dailyCodes = weatherData?.daily?.weathercode || [];
  const dailyMax = weatherData?.daily?.temperature_2m_max || [];
  const dailyMin = weatherData?.daily?.temperature_2m_min || [];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      {/* City & Today Temp */}
      <div className="flex items-center gap-2.5">
        <CurrentIcon className={`w-8 h-8 ${currentInfo.color}`} />
        <div>
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <span>{city.name}</span>
            <span className="text-xs font-normal text-gray-300">{loading ? '...' : `${currentTemp}°C`}</span>
          </div>
          <span className="text-[11px] text-gray-400 block">{currentInfo.label}</span>
        </div>
      </div>

      {/* 7 Days Row - Icons side by side */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {dailyTimes.map((dateStr, idx) => {
          const dateObj = new Date(dateStr);
          const dayName = idx === 0 
            ? 'امروز' 
            : new Intl.DateTimeFormat('fa-IR', { weekday: 'narrow' }).format(dateObj);
          const info = getWeatherIcon(dailyCodes[idx]);
          const IconComp = info.icon;
          const max = dailyMax[idx] !== undefined ? Math.round(dailyMax[idx]) : '-';
          const min = dailyMin[idx] !== undefined ? Math.round(dailyMin[idx]) : '-';

          return (
            <div
              key={dateStr}
              className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 transition min-w-[38px] text-center"
              title={`${new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(dateObj)}: ${info.label} (${max}° / ${min}°)`}
            >
              <span className="text-[10px] text-gray-300 font-medium mb-0.5">{dayName}</span>
              <IconComp className={`w-4 h-4 ${info.color} my-0.5`} />
              <span className="text-[9px] text-gray-400 font-mono" dir="ltr">{max}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
