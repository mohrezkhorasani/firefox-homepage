import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RotateCcw,
  ExternalLink,
  Calendar,
  Flame,
  GitCommit,
  GitBranch,
  Star,
  GitFork,
  BookOpen,
  Users
} from 'lucide-react';
import { formatRelativeTime, formatEventAction, formatPersianDateString } from '../services/githubService';

const LEVEL_COLORS = [
  'bg-white/5 border border-white/5',      // 0
  'bg-emerald-950 border border-emerald-800 text-emerald-200', // 1
  'bg-emerald-800 border border-emerald-600 text-emerald-100', // 2
  'bg-emerald-600 border border-emerald-400 text-white',       // 3
  'bg-emerald-400 border border-emerald-200 text-black'        // 4
];

export default function GithubModal({
  isOpen,
  onClose,
  data,
  onRefresh,
  isLoading
}) {
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'activities'
  const [hoveredDay, setHoveredDay] = useState(null);

  if (!isOpen) return null;

  const profile = data?.profile || {};
  const events = data?.events || [];
  const contributions = data?.contributions || { total: 0, contributions: [] };
  const dailyList = contributions.contributions || [];

  const modalNode = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="glass w-full max-w-4xl max-h-[90vh] rounded-3xl border border-white/20 shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.login || 'GitHub User'}
                  className="w-12 h-12 rounded-2xl border-2 border-emerald-400/40 shadow-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                  <i className="fab fa-github text-white" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {profile.name || data?.username || 'mohrezkhorasani'}
                </h2>
                <a
                  href={`https://github.com/${data?.username || 'mohrezkhorasani'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-cyan-300 transition"
                  title="مشاهده در گیت‌هاب"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                @{data?.username || 'mohrezkhorasani'}
                {profile.bio && <span className="text-slate-300 font-sans mr-2">· {profile.bio}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition ${
                isLoading ? 'animate-spin text-cyan-400' : ''
              }`}
              title="بروزرسانی داده‌ها"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="px-5 py-3 bg-black/20 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>{contributions.total || 0} مشارکت در سال گذشته</span>
            </div>
            {profile.public_repos !== undefined && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>{profile.public_repos} مخزن عمومی</span>
              </div>
            )}
            {profile.followers !== undefined && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>{profile.followers} دنبال‌کننده</span>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>تقویم سالانه</span>
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'activities'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>آخرین فعالیت‌ها ({events.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'calendar' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>تقویم مشارکت‌ها (Contributions Graph)</span>
                </h3>

                {/* Legend */}
                <div className="flex items-center gap-1 text-[11px] text-slate-400" dir="ltr">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-sm bg-white/5 border border-white/10" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-950 border border-emerald-800" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800 border border-emerald-600" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-400" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-200" />
                  <span>More</span>
                </div>
              </div>

              {/* Annual Matrix Heatmap */}
              {dailyList.length > 0 ? (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 overflow-x-auto">
                  <div className="min-w-[700px]">
                    <div 
                      className="grid grid-flow-col gap-1 auto-cols-[11px]" 
                      style={{ gridTemplateRows: 'repeat(7, 11px)' }}
                      dir="ltr"
                    >
                      {dailyList.map((day, idx) => {
                        const level = Math.min(Math.max(day.level || 0, 0), 4);
                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={`w-[11px] h-[11px] rounded-xs cursor-pointer transition-all duration-150 hover:scale-150 hover:z-20 ${LEVEL_COLORS[level]}`}
                            title={`${day.count} مشارکت در ${day.date}`}
                          />
                        );
                      })}
                    </div>

                    {/* Hover Info Banner */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-300 min-h-[28px]">
                      {hoveredDay ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">
                            {hoveredDay.count === 0 ? 'بدون مشارکت' : `${hoveredDay.count} مشارکت`}
                          </span>
                          <span className="text-slate-400">در</span>
                          <span className="font-bold text-amber-300">{formatPersianDateString(hoveredDay.date)}</span>
                          <span className="font-mono text-cyan-300 text-[11px] dir-ltr">({hoveredDay.date})</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">برای مشاهده جزئیات هر روز ماوس را روی خانه‌ها حرکت دهید.</span>
                      )}

                      <span className="text-slate-500 text-[11px] font-mono">
                        مجموع ثبت‌شده: {contributions.total} کامیت و فعالیت
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback SVG Chart */
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center">
                  <img
                    src={`https://ghchart.rshah.org/10b981/${data?.username || 'mohrezkhorasani'}`}
                    alt="GitHub Contributions"
                    className="w-full max-w-full rounded-lg filter drop-shadow-md"
                  />
                </div>
              )}

              {/* Monthly totals summary if available */}
              {contributions.totalsByYear && Object.keys(contributions.totalsByYear).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {Object.entries(contributions.totalsByYear).map(([yr, count]) => (
                    <div key={yr} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">سال {yr}</span>
                      <span className="text-sm font-bold text-emerald-400">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Activities Tab */
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-cyan-400" />
                <span>آخرین رویدادهای عمومی گیت‌هاب</span>
              </h3>

              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs">هیچ فعالیت عمومی اخیری یافت نشد.</p>
                </div>
              ) : (
                events.map((evt) => {
                  const info = formatEventAction(evt);
                  const repoUrl = `https://github.com/${evt.repo?.name || ''}`;

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-2xl bg-black/30 border border-white/5 hover:border-white/20 transition flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-white/5 mt-0.5 text-slate-300">
                          {evt.type === 'PushEvent' ? (
                            <GitCommit className="w-4 h-4 text-emerald-400" />
                          ) : evt.type === 'CreateEvent' ? (
                            <GitBranch className="w-4 h-4 text-cyan-400" />
                          ) : evt.type === 'WatchEvent' ? (
                            <Star className="w-4 h-4 text-amber-400" />
                          ) : evt.type === 'ForkEvent' ? (
                            <GitFork className="w-4 h-4 text-purple-400" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-blue-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{info.title}</span>
                            {info.badge && (
                              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300">
                                {info.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-cyan-400 hover:underline truncate font-mono"
                            >
                              {evt.repo?.name}
                            </a>
                            {info.detail && (
                              <span className="text-[11px] text-slate-400 truncate">
                                · {info.detail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                        {formatRelativeTime(evt.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 px-5">
          <span>نام کاربری: <b className="text-white font-mono">{data?.username || 'mohrezkhorasani'}</b></span>
          <a
            href={`https://github.com/${data?.username || 'mohrezkhorasani'}`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>مشاهده مستقیم در GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

