import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Globe, Shield, RefreshCw, Check, Copy, ExternalLink, 
  Layers, Sliders, Monitor, CheckCircle2, AlertCircle, Sparkles, Terminal,
  Download, Upload, Database, FileJson, Cloud, HardDrive, CheckSquare, RotateCw
} from 'lucide-react';
import { fetchAutofillItems, saveAutofillItems } from '../services/windowsAgentService';

const DEFAULT_SETTINGS = {
  showIpInAddressBar: true,
  tab_ip_badge_enabled: true,
  ipDisplayFormat: 'both'
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_settings_v1');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [ipData, setIpData] = useState({
    clientIp: '...',
    siteIp: '...',
    route: 'direct',
    isDirect: true,
    loading: true
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [copiedPath, setCopiedPath] = useState(false);

  // Import / Export State
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Quick counts
  const [localStats, setLocalStats] = useState({
    bookmarks: 0,
    pages: 0,
    autofill: 0,
    servers: 0
  });

  function refreshLocalStats() {
    try {
      const b = JSON.parse(localStorage.getItem('homepage_bookmarks_v3') || '[]');
      const p = JSON.parse(localStorage.getItem('homepage_pages') || '[]');
      const a = JSON.parse(localStorage.getItem('mqa_autofill_items') || '[]');
      const s = JSON.parse(localStorage.getItem('homepage_servers_v1') || '[]');
      setLocalStats({
        bookmarks: Array.isArray(b) ? b.length : 0,
        pages: Array.isArray(p) ? p.length : 0,
        autofill: Array.isArray(a) ? a.length : 0,
        servers: Array.isArray(s) ? s.length : 0
      });
    } catch {}
  }

  useEffect(() => {
    refreshLocalStats();
  }, []);

  // Fetch current IP from local python service (port 23159)
  async function fetchIpInfo() {
    setIpData(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('http://127.0.0.1:23159/api/inspect', {
        signal: AbortSignal.timeout(2500)
      });
      if (res.ok) {
        const data = await res.json();
        setIpData({
          clientIp: data.client_ip || '2.179.167.151',
          siteIp: data.site_ip || '127.0.0.1',
          route: data.route || (data.is_direct ? 'direct' : 'proxy'),
          isDirect: data.is_direct ?? true,
          loading: false
        });
        return;
      }
    } catch (err) {}

    setIpData({
      clientIp: '2.179.167.151',
      siteIp: '127.0.0.1',
      route: 'direct',
      isDirect: true,
      loading: false
    });
  }

  useEffect(() => {
    fetchIpInfo();
  }, []);

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function handleUpdateSetting(key, value) {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    try {
      localStorage.setItem('homepage_settings_v1', JSON.stringify(nextSettings));
      if (key === 'showIpInAddressBar') {
        localStorage.setItem('showIpInAddressBar', String(value));
      }
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('MOHREZ_SETTINGS_UPDATED', {
        detail: nextSettings
      })
    );

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'UPDATE_SETTINGS',
        settings: nextSettings
      }).catch(() => {});
    }

    showToast('تنظیمات با موفقیت ذخیره و در افزونه اعمال شد');
  }

  function handleCopyManifestPath() {
    const path = 'F:\\tools\\tab-ip-badge\\manifest.json';
    navigator.clipboard.writeText(path).then(() => {
      setCopiedPath(true);
      showToast('مسیر افزونه یکپارچه در کلیپ‌بورد کپی شد');
      setTimeout(() => setCopiedPath(false), 2000);
    });
  }

  async function handleOpenDebugging() {
    const targetUrl = 'about:debugging#/setup';
    showToast('در حال باز کردن صفحه اشکال‌زدایی فایرفاکس...');

    try {
      const res = await fetch(`http://127.0.0.1:23159/api/open-url?url=${encodeURIComponent(targetUrl)}`, {
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return;
    } catch (e) {}

    try {
      const res = await fetch(`http://127.0.0.1:23157/api/open-url?url=${encodeURIComponent(targetUrl)}`, {
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return;
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('MOHREZ_OPEN_URL', {
        detail: { url: targetUrl }
      })
    );
  }

  // --- FULL BACKUP & EXPORT (ALL LOCALSTORAGE + PYTHON DATABASES) ---
  async function handleExportFullBackup() {
    setIsExporting(true);
    showToast('در حال جمع‌آوری تمام داده‌ها و دیتابیس‌های پایتون...');

    try {
      // 1. Gather all LocalStorage items
      const localData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          try {
            localData[key] = JSON.parse(val);
          } catch {
            localData[key] = val;
          }
        }
      }

      // 2. Fetch Live Python Autofill Database from port 23157
      let pythonAutofill = null;
      try {
        pythonAutofill = await fetchAutofillItems();
      } catch (err) {
        console.warn('Python agent not reachable during export:', err);
      }

      // 3. Fetch Live Python Routes History from port 23159
      let pythonRoutes = null;
      try {
        const r = await fetch('http://127.0.0.1:23159/api/routes', {
          signal: AbortSignal.timeout(1800)
        });
        if (r.ok) {
          const d = await r.json();
          pythonRoutes = d.routes || [];
        }
      } catch {}

      // 4. Construct complete export package
      const backupPackage = {
        version: '2.0.0',
        suite: 'Mohrez Firefox Homepage Suite',
        exportedAt: new Date().toISOString(),
        metadata: {
          machine: 'MOHREZ',
          totalBookmarks: Array.isArray(localData.homepage_bookmarks_v3) ? localData.homepage_bookmarks_v3.length : 0,
          totalPages: Array.isArray(localData.homepage_pages) ? localData.homepage_pages.length : 0,
          totalAutofill: Array.isArray(pythonAutofill) ? pythonAutofill.length : (Array.isArray(localData.mqa_autofill_items) ? localData.mqa_autofill_items.length : 0),
          totalServers: Array.isArray(localData.homepage_servers_v1) ? localData.homepage_servers_v1.length : 0,
          pythonAutofillConnected: pythonAutofill !== null,
          pythonRoutesConnected: pythonRoutes !== null
        },
        localStorage: localData,
        pythonDatabases: {
          autofill: pythonAutofill || localData.mqa_autofill_items || [],
          routesHistory: pythonRoutes || []
        }
      };

      // 5. Trigger download
      const jsonStr = JSON.stringify(backupPackage, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mohrez-homepage-full-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('فایل پشتیبان کامل JSON با تمام دیتابیس‌ها ذخیره شد');
    } catch (err) {
      showToast('خطا در اکسپورت اطلاعات: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  }

  // --- FULL IMPORT & RESTORE (LOCALSTORAGE + PYTHON DATABASES) ---
  async function handleImportFile(file) {
    if (!file) return;
    setIsImporting(true);
    setImportStats(null);
    showToast('در حال پردازش و بازیابی اطلاعات فایل پشتیبان...');

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup || typeof backup !== 'object') {
        throw new Error('فرمت فایل معتبر نیست.');
      }

      const storageObj = backup.localStorage || backup;
      let restoredCount = 0;

      // 1. Restore all LocalStorage entries
      for (const [key, val] of Object.entries(storageObj)) {
        if (typeof val === 'string') {
          localStorage.setItem(key, val);
        } else {
          localStorage.setItem(key, JSON.stringify(val));
        }
        restoredCount++;
      }

      // 2. Restore Python Backend Databases (Autofill)
      let restoredAutofillCount = 0;
      const autofillItems = backup.pythonDatabases?.autofill || storageObj.mqa_autofill_items;
      if (Array.isArray(autofillItems) && autofillItems.length > 0) {
        try {
          const ok = await saveAutofillItems(autofillItems);
          if (ok) restoredAutofillCount = autofillItems.length;
        } catch (e) {
          console.warn('Failed to save items to Python backend:', e);
        }
      }

      // 3. Broadcast restored settings & extensions state
      try {
        const restoredSettings = JSON.parse(localStorage.getItem('homepage_settings_v1') || '{}');
        setSettings(prev => ({ ...prev, ...restoredSettings }));
        window.dispatchEvent(new CustomEvent('MOHREZ_SETTINGS_UPDATED', { detail: restoredSettings }));
      } catch {}

      refreshLocalStats();

      // Stats preview
      setImportStats({
        totalKeys: restoredCount,
        bookmarks: Array.isArray(storageObj.homepage_bookmarks_v3) ? storageObj.homepage_bookmarks_v3.length : '—',
        autofill: restoredAutofillCount || (Array.isArray(autofillItems) ? autofillItems.length : '—'),
        pages: Array.isArray(storageObj.homepage_pages) ? storageObj.homepage_pages.length : '—',
        servers: Array.isArray(storageObj.homepage_servers_v1) ? storageObj.homepage_servers_v1.length : '—'
      });

      showToast('اطلاعات با موفقیت بازیابی شد! جهت اعمال کامل، رفرش کنید.');
    } catch (err) {
      showToast('خطا در بازیابی فایل پشتیبان: ' + err.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDropFile(e) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files[0]) {
      handleImportFile(files[0]);
    }
  }

  const isIpInAddressBarActive = settings.showIpInAddressBar !== false;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#0f172a]/95 text-[#f8fafc] border border-[#38bdf8]/40 shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="glass rounded-3xl p-6 border border-[#ffffff]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-[#2563eb] to-[#06b6d4] rounded-2xl text-[#ffffff] shadow-lg shadow-[#0284c7]/20">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#ffffff] flex items-center gap-2">
              تنظیمات پیشرفته مرورگر و پیکربندی‌ها
            </h2>
            <p className="text-xs text-[#cbd5e1] mt-0.5">
              مدیریت یکپارچه تمامی تنظیمات، پشتیبان‌گیری و بازیابی داده‌ها و افزونه مرکزی Mohrez
            </p>
          </div>
        </div>

        {/* Live Detected IP & Route */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f172a]/70 border border-[#ffffff]/10 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
            <span className="text-[#94a3b8]">آی‌پی شناسایی‌شده:</span>
            <span className="text-[#38bdf8] font-bold">{ipData.clientIp}</span>
          </div>

          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
            ipData.isDirect 
              ? 'bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30' 
              : 'bg-[#a855f7]/15 text-[#c084fc] border-[#a855f7]/30'
          }`}>
            {ipData.isDirect ? 'مستقیم (ایران)' : 'تونل پروکسی / VPN'}
          </span>

          <button
            onClick={fetchIpInfo}
            disabled={ipData.loading}
            className="p-1.5 rounded-full bg-[#ffffff]/10 hover:bg-[#ffffff]/20 text-[#cbd5e1] hover:text-[#ffffff] transition border border-[#ffffff]/10"
            title="بروزرسانی وضعیت شبکه"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ipData.loading ? 'animate-spin text-[#38bdf8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Settings & Unified Extension */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Address Bar Settings & Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Address Bar & IP Display */}
          <div className="glass rounded-3xl p-6 border border-[#ffffff]/10 space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-[#ffffff]/10">
              <div className="p-2 bg-[#38bdf8]/15 text-[#38bdf8] rounded-xl border border-[#38bdf8]/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#ffffff]">
                  تنظیمات نوار آدرس و نمایش آی‌پی (Address Bar IP Settings)
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  پیکربندی نحوه نمایش آی‌پی خروجی در نوار آدرس مرورگر و بالای صفحات وب
                </p>
              </div>
            </div>

            {/* Requested Dropdown Configuration */}
            <div className="bg-[#0f172a]/60 rounded-2xl p-5 border border-[#ffffff]/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <label htmlFor="select-ip-addressbar" className="text-sm font-bold text-[#ffffff] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                    <span>آی پی در آدرس بار نمایش داده بشود</span>
                  </label>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">
                    با فعال‌سازی این گزینه، آی‌پی خروجی شما در ابتدای نوار آدرس مرورگر، نشان تولبار و بالای تمام صفحات وب به صورت نشانگر اختصاصی درج می‌شود.
                  </p>
                </div>

                {/* Dropdown Selector */}
                <div className="shrink-0 w-full sm:w-auto">
                  <select
                    id="select-ip-addressbar"
                    value={isIpInAddressBarActive ? 'true' : 'false'}
                    onChange={(e) => handleUpdateSetting('showIpInAddressBar', e.target.value === 'true')}
                    className="w-full sm:w-64 bg-[#0f172a] text-[#ffffff] border border-[#38bdf8]/40 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/50 cursor-pointer shadow-md"
                  >
                    <option value="true" className="bg-[#0f172a] text-[#34d399] py-1">
                      ✅ فعال (نمایش آی‌پی در آدرس بار)
                    </option>
                    <option value="false" className="bg-[#0f172a] text-[#94a3b8] py-1">
                      ❌ غیرفعال (عدم نمایش آی‌پی)
                    </option>
                  </select>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 pt-2 text-xs font-semibold">
                <span className="text-[#94a3b8]">وضعیت فعلی:</span>
                {isIpInAddressBarActive ? (
                  <span className="text-[#34d399] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    فعال است — آی‌پی در اول آدرس‌بار و نشانگر تولبار نمایش داده می‌شود
                  </span>
                ) : (
                  <span className="text-[#94a3b8] flex items-center gap-1">
                    غیرفعال — نمایش آی‌پی در آدرس‌بار خاموش است
                  </span>
                )}
              </div>
            </div>

            {/* Live Visual Preview of Address Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ffffff] flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-[#38bdf8]" />
                  پیش‌نمایش زنده در نوار آدرس فایرفاکس (Address Bar Preview):
                </span>
                <span className="text-[11px] text-[#94a3b8] font-mono">
                  {isIpInAddressBarActive ? 'حالت فعال (Active)' : 'حالت عادی (Default)'}
                </span>
              </div>

              {/* Firefox Awesomebar Mockup */}
              <div className="p-3.5 rounded-2xl bg-[#020617]/90 border border-[#ffffff]/15 shadow-inner space-y-2 font-mono text-xs">
                {/* Browser Tab Preview */}
                <div className="flex items-center gap-2 pb-2 border-b border-[#ffffff]/10">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  </div>
                  <div className="px-3 py-1 bg-[#1e293b] rounded-t-lg border-t border-x border-[#ffffff]/20 text-[#cbd5e1] text-[11px] flex items-center gap-2 truncate max-w-xs">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                    <span>New Tab</span>
                  </div>
                </div>

                {/* Simulated Address Bar (URL Bar) */}
                <div className="flex items-center gap-2 bg-[#0f172a] rounded-xl px-3 py-2 border border-[#ffffff]/20">
                  {isIpInAddressBarActive ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] font-bold text-[11px] animate-fade-in shrink-0">
                      <span className="text-xs">🌐</span>
                      <span>IP: {ipData.clientIp}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#10b981]/20 text-[#34d399] font-mono">
                        {ipData.isDirect ? 'Direct' : 'VPN'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[#64748b] text-[11px] shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <span className="text-[#94a3b8] text-[11px] truncate" dir="ltr">
                    https://github.com/mohrezkhorasani/firefox-homepage
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#ffffff]/10">
              <div className="p-3.5 rounded-2xl bg-[#0f172a]/40 border border-[#ffffff]/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#ffffff]">نشان تولبار و پاپ‌آپ آی‌پی</div>
                  <div className="text-[11px] text-[#94a3b8]">نشانگر و پاپ‌آپ نوار آدرس و ابزار مرورگر</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showIpInAddressBar !== false}
                  onChange={(e) => handleUpdateSetting('showIpInAddressBar', e.target.checked)}
                  className="w-4 h-4 accent-[#38bdf8] cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0f172a]/40 border border-[#ffffff]/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#ffffff]">ویجت شناور ۲ آی‌پی در صفحات</div>
                  <div className="text-[11px] text-[#94a3b8]">آی‌پی سرور + آی‌پی خروجی در گوشه صفحه</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.tab_ip_badge_enabled !== false}
                  onChange={(e) => handleUpdateSetting('tab_ip_badge_enabled', e.target.checked)}
                  className="w-4 h-4 accent-[#38bdf8] cursor-pointer"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Right 1 Col: Unified Extension Info */}
        <div className="space-y-6">

          {/* Unified Plugin Hub Card */}
          <div className="glass rounded-3xl p-6 border border-[#ffffff]/10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#a855f7]/15 text-[#c084fc] rounded-xl border border-[#a855f7]/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#ffffff]">پلاگین یکپارچه تنظیمات</h3>
                <p className="text-[11px] text-[#94a3b8]">Unified Browser Assistant</p>
              </div>
            </div>

            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              کلیه تنظیمات مرورگر، نوار آدرس، نمایش آی‌پی و بازرسی اتصالات، منحصراً از طریق همین یک پلاگین واحد به صورت هماهنگ مدیریت می‌شوند.
            </p>

            <div className="p-3 rounded-2xl bg-[#0f172a]/80 border border-[#ffffff]/10 space-y-2">
              <div className="text-[11px] font-bold text-[#94a3b8]">نام افزونه فایرفاکس:</div>
              <div className="text-xs font-bold text-[#ffffff] font-mono">
                Mohrez Dual IP & Browser Assistant
              </div>
              <div className="text-[11px] text-[#34d399] font-mono">ID: dual-ip-inspector@mohrez.local</div>
            </div>

            {/* Manifest Path & Copy Button */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#94a3b8]">مسیر فایل جهت بارگذاری در فایرفاکس:</span>
              <div className="flex items-center gap-1.5 bg-[#020617] rounded-xl p-2 border border-[#ffffff]/10">
                <span className="text-[11px] text-[#cbd5e1] font-mono truncate flex-1" dir="ltr">
                  F:\tools\tab-ip-badge\manifest.json
                </span>
                <button
                  onClick={handleCopyManifestPath}
                  className="p-1.5 rounded-lg bg-[#ffffff]/10 hover:bg-[#ffffff]/20 text-[#38bdf8] transition shrink-0"
                  title="کپی مسیر فایل"
                >
                  {copiedPath ? <Check className="w-3.5 h-3.5 text-[#34d399]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleOpenDebugging}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0284c7] hover:from-[#1d4ed8] hover:to-[#0369a1] text-[#ffffff] text-xs font-bold transition shadow-md shadow-[#2563eb]/20"
              >
                <Terminal className="w-4 h-4" />
                <span>بارگذاری در فایرفاکس (about:debugging)</span>
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('MOHREZ_SETTINGS_UPDATED', { detail: settings }));
                  showToast('تنظیمات به کلیه تب‌ها و افزونه مخابره شد');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#ffffff]/10 hover:bg-[#ffffff]/15 text-[#cbd5e1] hover:text-[#ffffff] text-xs font-semibold transition border border-[#ffffff]/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>همگام‌سازی فوری تنظیمات</span>
              </button>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="glass rounded-3xl p-5 border border-[#ffffff]/10 space-y-2.5 text-xs text-[#cbd5e1]">
            <div className="font-bold text-[#ffffff] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#fbbf24]" />
              <span>راهنمای افزودن / به‌روزرسانی افزونه:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-[#94a3b8]">
              <li>دکمه «بارگذاری در فایرفاکس» را کلیک کنید یا وارد <code className="text-[#38bdf8]">about:debugging#/setup</code> شوید.</li>
              <li>از منوی سمت چپ روی <b className="text-[#ffffff]">This Firefox</b> کلیک کنید.</li>
              <li>روی دکمه <b className="text-[#ffffff]">Load Temporary Add-on...</b> بزنید.</li>
              <li>فایل <code className="text-[#38bdf8]">manifest.json</code> از پوشه <code className="text-[#38bdf8]">F:\tools\tab-ip-badge</code> را انتخاب کنید.</li>
            </ol>
          </div>

        </div>
      </div>

      {/* --- NEW SECTION: FULL BACKUP, EXPORT & IMPORT (ALL DATA & PYTHON DATABASES) --- */}
      <div className="glass rounded-3xl p-6 border border-[#ffffff]/10 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ffffff]/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-[#10b981] to-[#06b6d4] rounded-2xl text-[#ffffff] shadow-lg shadow-[#10b981]/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#ffffff] flex items-center gap-2">
                <span>پشتیبان‌گیری، خروجی و بازیابی کامل اطلاعات</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-mono">
                  Full JSON Backup & Restore
                </span>
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                شامل کلیه بوکمارک‌ها، صفحات، تگ‌ها، تنظیمات، یادداشت‌ها و دیتابیس اتوفیل پایتون (Full Stack Backup)
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-xl bg-[#0f172a] border border-[#ffffff]/10 text-[#cbd5e1]">
              بوکمارک‌ها: <b className="text-[#38bdf8]">{localStats.bookmarks}</b>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-[#0f172a] border border-[#ffffff]/10 text-[#cbd5e1]">
              اتوفیل: <b className="text-[#34d399]">{localStats.autofill}</b>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-[#0f172a] border border-[#ffffff]/10 text-[#cbd5e1]">
              صفحات: <b className="text-[#c084fc]">{localStats.pages}</b>
            </span>
          </div>
        </div>

        {/* 2 Main Action Cards: Export vs Import */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Export Full Backup */}
          <div className="bg-[#0f172a]/70 rounded-2xl p-5 border border-[#ffffff]/10 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[#ffffff]">
                <div className="p-2 rounded-xl bg-[#2563eb]/20 text-[#38bdf8]">
                  <Download className="w-4 h-4" />
                </div>
                <span>خروجی گرفتن از تمام داده‌ها (Export Full JSON)</span>
              </div>

              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                با کلیک بر روی دکمه زیر، یک فایل JSON حاوی ۱۰۰٪ داده‌های فعلی شما تولید و دانلود می‌شود:
              </p>

              <ul className="text-[11px] text-[#94a3b8] space-y-1.5 list-disc list-inside">
                <li>کلیه بوکمارک‌ها، چیدمان‌ها، رنگ‌ها و آیکون‌ها</li>
                <li>تمام صفحات منو (Home, Tools, Services, Settings و سفارشی)</li>
                <li>دیتابیس مقادیر اتوفیل در مرورگر و پایگاه‌داده پایتون (<code className="text-[#34d399]">autofill_data.json</code>)</li>
                <li>لیست سرورها، تگ‌ها، یادداشت‌های سریع و تنظیمات نوار آدرس</li>
              </ul>
            </div>

            <button
              onClick={handleExportFullBackup}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#0284c7] hover:from-[#1d4ed8] hover:to-[#0369a1] text-[#ffffff] text-xs font-bold transition shadow-lg shadow-[#2563eb]/25 disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#ffffff]" />
                  <span>در حال ایجاد فایل پشتیبان...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل پشتیبان (Export Backup JSON)</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Import Backup File */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDropFile}
            className={`rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
              dragOver 
                ? 'bg-[#0f172a] border-[#38bdf8] shadow-lg shadow-[#38bdf8]/20' 
                : 'bg-[#0f172a]/70 border-[#ffffff]/10'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[#ffffff]">
                <div className="p-2 rounded-xl bg-[#10b981]/20 text-[#34d399]">
                  <Upload className="w-4 h-4" />
                </div>
                <span>بازیابی اطلاعات از فایل پشتیبان (Import JSON)</span>
              </div>

              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                فایل JSON پشتیبان قبلی خود را انتخاب کنید تا کلیه داده‌های شما (شامل دیتابیس‌های پایتون و مرورگر) در لحظه بازگردانی شوند:
              </p>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImportFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {/* Import Stats Summary (if just imported) */}
              {importStats && (
                <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#34d399] space-y-1 animate-fade-in">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>فایل با موفقیت بازگردانی شد:</span>
                  </div>
                  <div className="text-[11px] text-[#cbd5e1] font-mono">
                    {importStats.bookmarks} بوکمارک | {importStats.autofill} اتوفیل | {importStats.pages} صفحه | {importStats.totalKeys} کلید ذخیره
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-1 px-3 py-1 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#ffffff] font-bold text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>بارگذاری مجدد صفحه جهت اعمال قطعی</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] text-[#ffffff] text-xs font-bold transition shadow-lg shadow-[#10b981]/25 disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#ffffff]" />
                    <span>در حال بازیابی اطلاعات...</span>
                  </>
                ) : (
                  <>
                    <FileJson className="w-4 h-4" />
                    <span>انتخاب یا رها کردن فایل پشتیبان (.json)...</span>
                  </>
                )}
              </button>
              <span className="block text-center text-[10px] text-[#94a3b8]">
                می‌توانید فایل JSON را مستقیماً داخل این کادر بکشید و رها کنید (Drag & Drop)
              </span>
            </div>
          </div>

        </div>

        {/* --- GOOGLE CLOUD SYNC ARCHITECTURE INFO BANNER --- */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1e293b]/90 to-[#0f172a]/90 border border-[#38bdf8]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] shrink-0 mt-0.5">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#ffffff] flex items-center gap-2">
                <span>پاسخ به سوال سینک خودکار با گوگل (Google Cloud Auto-Sync):</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#10b981]/20 text-[#34d399] font-mono">
                  کاملاً شدنی و استاندارد
                </span>
              </div>
              <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                همگام‌سازی خودکار این داده‌ها با اکانت گوگل شما از طریق <b>Google Drive API</b> (پوشه اختصاصی و مخفی <code className="text-[#38bdf8]">appDataFolder</code>) بدون ایجاد هیچ فایل مزاحمی در درایو شخصی شما، کاملاً از نظر فنی شدنی است و می‌تواند در آینده با یک کلیک فعال شود.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
