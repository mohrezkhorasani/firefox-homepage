import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Square, Trash2, Plus, StickyNote, Network, 
  Layers, Check, Copy, ExternalLink, RefreshCw 
} from 'lucide-react';

export default function ToolsPage({ pages, onRemovePage, onRenamePage }) {
  // To-Do State
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('my_todos');
    return saved ? JSON.parse(saved) : [
      { text: 'بررسی وضعیت سرورهای حکمت', completed: false },
      { text: 'تمدید گواهی SSL پارس‌پک', completed: true },
      { text: 'بررسی کانفیگ‌های v2ray', completed: false }
    ];
  });
  const [todoInput, setTodoInput] = useState('');
  const [todoFilter, setTodoFilter] = useState('all');

  // Notes State
  const [note, setNote] = useState(() => {
    return localStorage.getItem('homepage_scratchpad') || '';
  });

  useEffect(() => {
    localStorage.setItem('my_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('homepage_scratchpad', note);
  }, [note]);

  // To-Do Handlers
  function addTodo(e) {
    e.preventDefault();
    if (!todoInput.trim()) return;
    setTodos([{ text: todoInput.trim(), completed: false }, ...todos]);
    setTodoInput('');
  }

  function toggleTodo(idx) {
    setTodos(todos.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t));
  }

  function deleteTodo(idx) {
    setTodos(todos.filter((_, i) => i !== idx));
  }

  const filteredTodos = todos.filter((t) => {
    if (todoFilter === 'active') return !t.completed;
    if (todoFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* 1. To-Do List */}
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">لیست کارها (To-Do)</h3>
          </div>
          <div className="flex gap-1 text-[11px]">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setTodoFilter(f)}
                className={`px-2.5 py-1 rounded-lg transition font-medium ${
                  todoFilter === f 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'همه' : f === 'active' ? 'انجام‌نشده' : 'انجام‌شده'}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={addTodo} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="کار جدید را بنویسید و اینتر بزنید..."
            value={todoInput}
            onChange={(e) => setTodoInput(e.target.value)}
            className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition"
          />
          <button
            type="submit"
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredTodos.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-12">هیچ موردی وجود ندارد</p>
          ) : (
            filteredTodos.map((todo, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl glass-subtle border border-white/5 hover:border-white/20 transition group"
              >
                <button
                  type="button"
                  onClick={() => toggleTodo(idx)}
                  className="flex items-center gap-2.5 flex-1 text-right"
                >
                  {todo.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-cyan-400" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      todo.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {todo.text}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => deleteTodo(idx)}
                  className="text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Scratchpad / Notes */}
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">دفترچه یادداشت سریع</h3>
          </div>
          <span className="text-[11px] text-slate-400">ذخیره خودکار</span>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="یادداشت‌ها، دستورات شل، لینک‌های موقت یا متن دلخواه را اینجا بنویسید (در مرورگر ذخیره می‌شود)..."
          className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-amber-400/50 resize-none font-mono leading-relaxed"
        />

        <div className="flex justify-between items-center pt-3 text-xs text-slate-400">
          <span>تعداد کلمات: {note.trim() ? note.trim().split(/\s+/).length : 0}</span>
          <button
            onClick={() => setNote('')}
            className="text-rose-400 hover:underline text-[11px]"
          >
            پاک کردن کل یادداشت
          </button>
        </div>
      </div>

      {/* 3. Page Manager & Quick Links */}
      <div className="glass rounded-3xl p-6 border border-white/10 flex flex-col h-[520px] justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">مدیریت صفحه‌ها</h3>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            صفحه‌های فعال در نوار پایین سمت چپ:
          </p>

          <div className="space-y-2 mb-6">
            {pages.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl glass-subtle border border-white/10"
              >
                <span className="text-sm font-semibold text-white">{p.name}</span>
                {p.id !== 'home' && p.id !== 'tools' ? (
                  <button
                    onClick={() => onRemovePage(p.id)}
                    className="text-rose-400 hover:text-rose-300 text-xs p-1"
                    title="حذف صفحه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">پیش‌فرض</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Network test quick shortcuts */}
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5">
            <Network className="w-4 h-4 text-cyan-400" />
            ابزارهای سریع وب و شبکه:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href="https://speedtest.net"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl glass-subtle hover:bg-white/10 text-cyan-300 flex items-center justify-between border border-cyan-500/20"
            >
              <span>تست سرعت اینترنت</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://dnsleaktest.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl glass-subtle hover:bg-white/10 text-purple-300 flex items-center justify-between border border-purple-500/20"
            >
              <span>تست نشت DNS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
