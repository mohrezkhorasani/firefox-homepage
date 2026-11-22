import React, { useState, useEffect } from 'react';
import { 
  Settings, Globe, Shield, RefreshCw, Check, Copy, ExternalLink, 
  Layers, Sliders, Monitor, CheckCircle2, AlertCircle, Sparkles, Terminal
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  showIpInAddressBar: true,
  tab_ip_badge_enabled: true,
  showIpInTabTitle: true,
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

    // Fallback if service unreachable
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
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleUpdateSetting(key, value) {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    // 1. Persist to localStorage
    try {
      localStorage.setItem('homepage_settings_v1', JSON.stringify(nextSettings));
      if (key === 'showIpInAddressBar') {
        localStorage.setItem('showIpInAddressBar', String(value));
      }
    } catch (e) {}

    // 2. Dispatch custom event for content scripts
    window.dispatchEvent(
      new CustomEvent('MOHREZ_SETTINGS_UPDATED', {
        detail: nextSettings
      })
    );

    // 3. Send message to background script if chrome runtime available
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

    // Try Python service on 23159
    try {
      const res = await fetch(`http://127.0.0.1:23159/api/open-url?url=${encodeURIComponent(targetUrl)}`, {
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return;
    } catch (e) {}

    // Try Windows agent on 23157
    try {
      const res = await fetch(`http://127.0.0.1:23157/api/open-url?url=${encodeURIComponent(targetUrl)}`, {
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return;
    } catch (e) {}

    // Extension fallback
    window.dispatchEvent(
      new CustomEvent('MOHREZ_OPEN_URL', {
        detail: { url: targetUrl }
      })
    );
  }

  const isIpInAddressBarActive = settings.showIpInAddressBar !== false;

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#0f172a]/95 text-[#f8fafc] border border-[#38bdf8]/40 shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md">
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
              مدیریت یکپارچه تمامی تنظیمات و قابلیت‌های مرورگر از طریق افزونه مرکزی Mohrez Dual IP & Browser Assistant
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

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Configuration Items & Live Address Bar Mockup */}
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

            {/* Live Visual Preview of Address Bar (شبیه‌ساز زنده نوار آدرس فایرفاکس) */}
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
                    <span>
                      {isIpInAddressBarActive && settings.showIpInTabTitle !== false 
                        ? `[${ipData.clientIp}] New Tab` 
                        : 'New Tab'}
                    </span>
                  </div>
                </div>

                {/* Simulated Address Bar (URL Bar) */}
                <div className="flex items-center gap-2 bg-[#0f172a] rounded-xl px-3 py-2 border border-[#ffffff]/20">
                  {/* Extension identity / IP badge at the START of address bar */}
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
              {/* Show in Tab Title */}
              <div className="p-3.5 rounded-2xl bg-[#0f172a]/40 border border-[#ffffff]/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#ffffff]">افزودن آی‌پی به عنوان تب مرورگر</div>
                  <div className="text-[11px] text-[#94a3b8]">[IP] Page Title</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showIpInTabTitle !== false}
                  onChange={(e) => handleUpdateSetting('showIpInTabTitle', e.target.checked)}
                  className="w-4 h-4 accent-[#38bdf8] cursor-pointer"
                />
              </div>

              {/* Show Dual IP Floating Widget */}
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

        {/* Right 1 Col: Unified Extension Management Info */}
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
              <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
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
    </div>
  );
}
