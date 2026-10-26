import React, { useState, useEffect, useCallback } from 'react';
import { Home, Wrench, Plus, X, Layers, Check } from 'lucide-react';
import IpWidget from './IpWidget';
import ServerPingWidget from './ServerPingWidget';
import ServerExtendPanel from './ServerExtendPanel';
import { DEFAULT_SERVERS } from '../data/defaultServers';
import { pingHost } from '../services/pingService';

export default function BottomNav({ pages, activePage, onSelectPage, onAddPage }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  // Servers State with localStorage persistence
  const [servers, setServers] = useState(() => {
    try {
      const saved = localStorage.getItem('homepage_servers_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved servers:', e);
    }
    return DEFAULT_SERVERS;
  });

  const [pingResults, setPingResults] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [initialShowAdd, setInitialShowAdd] = useState(false);

  // Persist servers
  useEffect(() => {
    localStorage.setItem('homepage_servers_v1', JSON.stringify(servers));
  }, [servers]);

  // Ping a single host
  const pingSingle = useCallback(async (id, host) => {
    setPingResults((prev) => ({
      ...prev,
      [id]: { ...prev[id], checking: true }
    }));
    const res = await pingHost(host);
    setPingResults((prev) => ({
      ...prev,
      [id]: { ...res, checking: false, lastChecked: Date.now() }
    }));
  }, []);

  // Ping all hosts in parallel batches
  const pingAll = useCallback(async (targetList) => {
    const list = targetList || servers;
    if (!list || list.length === 0) return;

    setIsRefreshing(true);
    setPingResults((prev) => {
      const next = { ...prev };
      list.forEach((s) => {
        next[s.id] = { ...(next[s.id] || {}), checking: true };
      });
      return next;
    });

    const chunkSize = 4;
    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (s) => {
          const res = await pingHost(s.host);
          setPingResults((prev) => ({
            ...prev,
            [s.id]: { ...res, checking: false, lastChecked: Date.now() }
          }));
        })
      );
    }
    setIsRefreshing(false);
  }, [servers]);

  // Initial ping on mount & 45s periodic refresh
  useEffect(() => {
    pingAll(servers);
    const interval = setInterval(() => {
      pingAll();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  function handleTogglePin(id) {
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  }

  function handleAddServer(newServer) {
    setServers((prev) => [newServer, ...prev]);
    pingSingle(newServer.id, newServer.host);
  }

  function handleDeleteServer(id) {
    setServers((prev) => prev.filter((s) => s.id !== id));
    setPingResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleResetDefaults() {
    setServers(DEFAULT_SERVERS);
    pingAll(DEFAULT_SERVERS);
  }

  function handleCreatePage(e) {
    e.preventDefault();
    if (!newPageName.trim()) return;
    const pageId = 'page_' + Date.now();
    onAddPage({
      id: pageId,
      name: newPageName.trim(),
      icon: 'Layers'
    });
    setNewPageName('');
    setIsModalOpen(false);
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 z-40 p-2.5 bg-black/70 backdrop-blur-md border-t border-r border-white/10 rounded-tr-2xl shadow-2xl flex flex-col gap-2 w-[215px]">
        {/* Server Ping Widget directly above IP widget */}
        <ServerPingWidget
          servers={servers}
          pingResults={pingResults}
          onRefreshAll={() => pingAll(servers)}
          onOpenExtend={() => {
            setInitialShowAdd(false);
            setIsExtendOpen(!isExtendOpen);
          }}
          onOpenAdd={() => {
            setInitialShowAdd(true);
            setIsExtendOpen(true);
          }}
          isRefreshing={isRefreshing}
        />

        {/* Simple IP Widget directly above navigation menu */}
        <IpWidget />

        <div className="grid grid-cols-2 gap-1.5 w-full">
          {pages.map((p) => {
            const isActive = activePage === p.id;
            const isHome = p.id === 'home';
            const isTools = p.id === 'tools';
            const Icon = isHome ? Home : isTools ? Wrench : Layers;

            return (
              <button
                key={p.id}
                onClick={() => onSelectPage(p.id)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md border border-blue-400'
                    : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 border border-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-cyan-300 hover:bg-white/15 border border-dashed border-cyan-400/30 text-xs font-bold transition"
            title="افزودن صفحه جدید"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>صفحه جدید</span>
          </button>
        </div>
      </div>

      {/* Add Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass rounded-2xl p-6 w-full max-w-sm border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">افزودن صفحه جدید</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  عنوان صفحه:
                </label>
                <input
                  type="text"
                  placeholder="مثلاً: سرورها، پروژه‌ها..."
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!newPageName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  ایجاد صفحه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Non-modal side flyout panel extending to the right */}
      <ServerExtendPanel
        isOpen={isExtendOpen}
        onClose={() => setIsExtendOpen(false)}
        servers={servers}
        pingResults={pingResults}
        onRefreshAll={() => pingAll(servers)}
        onRefreshSingle={pingSingle}
        onTogglePin={handleTogglePin}
        onAddServer={handleAddServer}
        onDeleteServer={handleDeleteServer}
        onResetDefaults={handleResetDefaults}
        isRefreshing={isRefreshing}
        initialShowAdd={initialShowAdd}
      />
    </>
  );
}
