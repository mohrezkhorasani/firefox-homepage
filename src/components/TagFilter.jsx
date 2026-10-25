import React from 'react';

export default function TagFilter({ tags, activeTag, onSelectTag }) {
  return (
    <div className="fixed bottom-2 right-2 z-50 flex flex-col gap-1">
      {tags.map((tag) => {
        const isActive = activeTag === tag.id;

        return (
          <button
            key={tag.id}
            onClick={() => onSelectTag(tag.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md text-right border ${
              isActive
                ? `${tag.activeColor} shadow-lg scale-105`
                : 'bg-black/75 text-gray-300 hover:text-white hover:bg-black/90 border-white/10'
            }`}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
