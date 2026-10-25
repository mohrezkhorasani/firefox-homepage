import React, { useState, useEffect } from 'react';

export default function TodoWidget() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('my_todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    localStorage.setItem('my_todos', JSON.stringify(todos));
  }, [todos]);

  function handleAdd(e) {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setTodos([...todos, { text: inputVal.trim(), completed: false }]);
    setInputVal('');
  }

  function handleToggle(idx) {
    setTodos(todos.map((t, i) => i === idx ? { ...t, completed: !t.completed } : t));
  }

  function handleDelete(idx) {
    setTodos(todos.filter((_, i) => i !== idx));
  }

  return (
    <div className="glass rounded-2xl p-5 flex flex-col h-[350px] border border-white/20">
      <h2 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
        <i className="fas fa-tasks ml-2"></i>لیست کارها
      </h2>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="کار جدید..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 transition"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          <i className="fas fa-plus"></i>
        </button>
      </form>

      <ul className="flex-1 overflow-y-auto space-y-2 pr-1">
        {todos.map((todo, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between bg-white/10 p-2 rounded-lg group hover:bg-white/20 transition"
          >
            <div className="flex items-center gap-3 w-full overflow-hidden">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(idx)}
                className="w-4 h-4 cursor-pointer accent-blue-500"
              />
              <span
                className={`text-sm truncate ${todo.completed ? 'line-through text-gray-400' : 'text-white'}`}
                dir="auto"
              >
                {todo.text}
              </span>
            </div>
            <button
              onClick={() => handleDelete(idx)}
              className="text-red-400 opacity-0 group-hover:opacity-100 transition px-2"
            >
              <i className="fas fa-trash"></i>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
