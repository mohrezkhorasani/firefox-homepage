import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, AlertTriangle, CheckCircle2, FolderTree, BarChart2 } from 'lucide-react';
import { fetchSystemDrives } from '../services/windowsAgentService';
import DriveAnalyzerModal from './DriveAnalyzerModal';

export default function SystemDrivesWidget() {
  const [drivesData, setDrivesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Full-page Modal State
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [selectedDriveForAnalysis, setSelectedDriveForAnalysis] = useState('C:');

  async function loadDrives() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSystemDrives();
      setDrivesData(data);
      setLastUpdated(new Date().toLocaleTimeString('fa-IR'));
    } catch (err) {
      setError(err.message || 'خطا در برقراری ارتباط با سرویس پایتون');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDrives();
    // Auto refresh every 30 seconds
    const timer = setInterval(loadDrives, 30000);
    return () => clearInterval(timer);
  }, []);

  function handleOpenAnalyzer(driveName) {
    setSelectedDriveForAnalysis(driveName || 'C:');
    setIsAnalyzerOpen(true);
  }

  const drivesList = drivesData?.drives || [];

  return (
    <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">فضای درایوهای ویندوز</h3>
            <p className="text-[11px] text-slate-400">
              {drivesData?.system?.computer_name ? `${drivesData.system.computer_name} (${drivesData.system.username})` : 'سرویس محلی ویندوز'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {drivesList.length > 0 && (
            <button
              onClick={() => handleOpenAnalyzer(drivesList[0]?.drive || 'C:')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
              title="تحلیل جامع و درختی فولدرها"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>تحلیل درختی</span>
            </button>
          )}

          <button
            onClick={loadDrives}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            title="به‌روزرسانی"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {isLoading && !drivesData ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs">در حال دریافت وضعیت درایوها...</span>
          </div>
        ) : error && !drivesData ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
            <p className="text-sm font-semibold text-white mb-1">عدم اتصال به سرویس پایتون</p>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{error}</p>
            <button
              onClick={loadDrives}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition shadow-lg"
            >
              تلاش مجدد
            </button>
          </div>
        ) : (
          drivesList.map((d) => {
            const isHigh = d.percent >= 90;
            const isMid = d.percent >= 75 && !isHigh;

            let barColor = 'bg-emerald-500';
            let textColor = 'text-emerald-400';
            let borderColor = 'border-white/5';
            let bgLight = 'bg-white/5';

            if (isHigh) {
              barColor = 'bg-rose-500';
              textColor = 'text-rose-400';
              borderColor = 'border-rose-500/30';
              bgLight = 'bg-rose-500/5';
            } else if (isMid) {
              barColor = 'bg-amber-500';
              textColor = 'text-amber-400';
              borderColor = 'border-amber-500/30';
              bgLight = 'bg-amber-500/5';
            }

            return (
              <div
                key={d.drive}
                className={`p-4 rounded-2xl glass-subtle border ${borderColor} ${bgLight} transition hover:border-white/20`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-white tracking-wide">
                      {d.drive}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {d.label ? `(${d.label})` : ''}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-slate-400 font-mono">
                      {d.fs}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold font-mono ${textColor}`}>
                      {d.percent}%
                    </span>

                    <button
                      onClick={() => handleOpenAnalyzer(d.drive)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-300 border border-white/10 transition shadow-sm"
                      title={`تحلیل درختی فولدرهای درایو ${d.drive}`}
                    >
                      <FolderTree className="w-3 h-3 text-indigo-400 group-hover:text-white" />
                      <span>تحلیل فولدرها</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden p-0.5 mb-2 border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(2, d.percent))}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    مصرف‌شده: <strong className="text-slate-200 font-mono">{d.used_gb} GB</strong>
                  </span>
                  <span>
                    فضای آزاد: <strong className="text-slate-200 font-mono">{d.free_gb} GB</strong>
                  </span>
                  <span>
                    کل: <strong className="text-slate-200 font-mono">{d.total_gb} GB</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>پایتون تسک‌استارتاپ فعال</span>
        </div>
        {lastUpdated && (
          <span>بروزرسانی: {lastUpdated}</span>
        )}
      </div>

      {/* Full-Page Drive Tree Analyzer Modal */}
      <DriveAnalyzerModal
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
        initialDrive={selectedDriveForAnalysis}
        availableDrives={drivesList}
      />
    </div>
  );
}
