import React, { useState, useEffect } from 'react';

export default function TripleDate() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Shamsi
  const shamsiText = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
  const shamsiNum = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  // Qamari
  let qamariText = '';
  let qamariNum = '';
  try {
    qamariText = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);
    qamariNum = new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  } catch {
    qamariText = '-';
  }

  // Miladi
  const miladiText = new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
  const miladiNum = new Intl.DateTimeFormat('en-CA').format(now);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs  text-gray-200 mt-1">
      {/* Shamsi */}
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{shamsiText}</span>
        <span className="font-bold text-gray-400 bg-[#0000006c]  px-1 rounded text-[11px]" dir="ltr">{shamsiNum}</span>
      </div>

      <span className="text-gray-500">•</span>

      {/* Qamari */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-300">قمری: {qamariText}</span>
        <span className="font-bold text-gray-400 bg-[#0000006c]  px-1 rounded text-[11px]" dir="ltr">{qamariNum}</span>
      </div>

      <span className="text-gray-500">•</span>

      {/* Miladi */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-300">میلادی: {miladiText}</span>
        <span className="font-bold text-gray-400 bg-[#0000006c] px-1 rounded text-[11px]" dir="ltr">{miladiNum}</span>
      </div>
    </div>
  );
}
