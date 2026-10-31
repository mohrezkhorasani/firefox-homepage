import React, { useState, useEffect } from 'react';
import { Server, Clock, Activity, Cpu, ShieldCheck, RefreshCw } from 'lucide-react';
import PinnedServicesWidget from './PinnedServicesWidget';
import PinnedTasksWidget from './PinnedTasksWidget';
import PinnedFirewallWidget from './PinnedFirewallWidget';
import { fetchSystemInfo, findActiveAgentPort } from '../services/windowsAgentService';

export default function ServicesPage() {
  const [sysInfo, setSysInfo] = useState(null);
  const [activePort, setActivePort] = useState(null);

  useEffect(() => {
    async function loadInfo() {
      const port = await findActiveAgentPort();
      setActivePort(port);
      const info = await fetchSystemInfo();
      if (info?.system) setSysInfo(info.system);
    }
    loadInfo();
  }, []);

  return (
    <div className="w-full space-y-6 animate-fade-in" dir="rtl">
      {/* Top Banner */}
      <div className="glass rounded-3xl p-5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-2xl text-white shadow-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              مدیریت سرویس‌ها، تسک‌ها و فایروال ویندوز
            </h2>
            <p className="text-xs text-slate-300">
              پایش لحظه‌ای وضعیت، اجرا و توقف سرویس‌ها، مدیریت وظایف Task Scheduler و مدیریت پورت‌های باز فایروال
            </p>
          </div>
        </div>

        {/* System & Agent Badges */}
        <div className="flex items-center gap-2 text-xs">
          {activePort ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ویندوز ایجنت: پورت {activePort}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
              <span>در حال برقراری ارتباط با پایتون...</span>
            </span>
          )}

          {sysInfo && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10 font-mono">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>{sysInfo.computer_name} ({sysInfo.username})</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Widgets Grid: Services on Left, Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PinnedServicesWidget />
        <PinnedTasksWidget />
      </div>

      {/* Windows Firewall & Open Ports Section */}
      <div className="w-full">
        <PinnedFirewallWidget />
      </div>
    </div>
  );
}
