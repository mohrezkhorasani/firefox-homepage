import React, { useState, useEffect } from 'react';
import { X, Send, Plus, Trash2, Pin, Check, AlertCircle, Play, Sliders } from 'lucide-react';
import ApiJsonTree from './ApiJsonTree';
import { executeApiCall, getNestedValue, formatParamValue } from '../services/apiMonitorService';

export default function ApiModal({ isOpen, onClose, onSave, editingApi = null }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState([]);
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState([]);

  // Test Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (editingApi) {
      setTitle(editingApi.title || '');
      setUrl(editingApi.url || '');
      setMethod(editingApi.method || 'GET');
      setHeaders(editingApi.headers || []);
      setBody(editingApi.body || '');
      setPinned(editingApi.pinned !== false);
      setSelectedKeys(editingApi.selectedKeys || []);
      setTestResult(null);
    } else {
      setTitle('');
      setUrl('');
      setMethod('GET');
      setHeaders([]);
      setBody('');
      setPinned(true);
      setSelectedKeys([]);
      setTestResult(null);
    }
  }, [editingApi, isOpen]);

  if (!isOpen) return null;

  function handleAddHeader() {
    setHeaders([...headers, { key: '', value: '' }]);
  }

  function handleHeaderChange(index, field, value) {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  }

  function handleRemoveHeader(index) {
    setHeaders(headers.filter((_, i) => i !== index));
  }

  async function handleTest() {
    if (!url.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    const res = await executeApiCall({
      url: url.trim(),
      method,
      headers,
      body
    });

    setTestResult(res);
    setIsTesting(false);
  }

  function handleToggleKey(keyPath) {
    if (selectedKeys.includes(keyPath)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== keyPath));
    } else {
      setSelectedKeys([...selectedKeys, keyPath]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    onSave({
      id: editingApi?.id || 'api_' + Date.now(),
      title: title.trim(),
      url: url.trim(),
      method,
      headers: headers.filter((h) => h.key && h.key.trim()),
      body: ['POST', 'PUT'].includes(method) ? body : '',
      pinned,
      selectedKeys
    });

    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900/95 border border-white/15 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-600/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {editingApi ? 'ویرایش API' : 'افزودن API جدید جهت پایش'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
          {/* Title & Method */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-[11px] text-gray-400 mb-1 font-medium">عنوان API:</label>
              <input
                type="text"
                placeholder="مثال: وضعیت سرور، نرخ دلار، وضعیت لاگین"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-medium">متد درخواست:</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          {/* URL & Test Button */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-medium">آدرس URL (Root Endpoint):</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="https://api.example.com/v1/status یا http://192.168.0.4:1940/api/info"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || !url.trim()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition shadow ${
                  isTesting ? 'animate-pulse' : ''
                }`}
                title="تست ارتباط و دریافت ساختار JSON"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isTesting ? 'تست...' : 'تست اتصال'}</span>
              </button>
            </div>
          </div>

          {/* Headers Editor */}
          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-300">هدرها (Headers):</span>
              <button
                type="button"
                onClick={handleAddHeader}
                className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 font-medium transition"
              >
                <Plus className="w-3 h-3" />
                افزودن هدر
              </button>
            </div>

            {headers.length === 0 ? (
              <div className="text-[10px] text-gray-500">هدری تعریف نشده است.</div>
            ) : (
              headers.map((h, idx) => (
                <div key={idx} className="flex items-center gap-1.5" dir="ltr">
                  <input
                    type="text"
                    placeholder="Key (e.g. Authorization)"
                    value={h.key}
                    onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Bearer token...)"
                    value={h.value}
                    onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-black/60 border border-white/10 text-[11px] font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(idx)}
                    className="p-1 rounded text-gray-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Body Editor (Only for POST / PUT) */}
          {['POST', 'PUT'].includes(method) && (
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-medium">بدنه درخواست (JSON Body):</label>
              <textarea
                rows={3}
                placeholder='{"service": "auth", "check": true}'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                dir="ltr"
              />
            </div>
          )}

          {/* Test Result Section */}
          {testResult && (
            <div className="space-y-2.5 pt-1">
              {/* Status Banner */}
              <div
                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                  testResult.ok
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      testResult.ok ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-bold">
                    {testResult.ok ? 'ارتباط برقرار شد' : 'خطا در ارتباط'} ({testResult.status} {testResult.statusText})
                  </span>
                </div>
                {testResult.time && (
                  <span className="font-mono text-[10px] text-gray-300">
                    {testResult.time} ms
                  </span>
                )}
              </div>

              {/* JSON Tree Explorer */}
              {testResult.data && (
                <ApiJsonTree
                  data={testResult.data}
                  selectedKeys={selectedKeys}
                  onToggleKey={handleToggleKey}
                />
              )}
            </div>
          )}

          {/* Selected Parameters Chips */}
          <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5">
            <span className="text-[11px] font-bold text-gray-300 block">
              پارامترهای انتخاب شده جهت نمایش در صفحه ({selectedKeys.length}):
            </span>

            {selectedKeys.length === 0 ? (
              <div className="text-[10px] text-gray-500">
                هنوز هیچ پارامتری انتخاب نشده است. (با زدن «تست اتصال» روی کلیدهای دلخواه کلیک کنید).
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedKeys.map((k) => {
                  const sampleVal = testResult?.data ? getNestedValue(testResult.data, k) : null;
                  return (
                    <span
                      key={k}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 text-xs font-mono"
                      dir="ltr"
                    >
                      <span className="font-bold">{k}</span>
                      {sampleVal !== undefined && (
                        <span className="text-[10px] text-gray-400">({formatParamValue(sampleVal)})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleKey(k)}
                        className="text-gray-400 hover:text-rose-400 transition ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pin Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded bg-black/40 border-white/20 text-cyan-500 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                پین در صفحه اصلی (حداکثر ۳ API اول پین‌شده نشان داده می‌شوند)
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition"
            >
              ذخیره API
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
