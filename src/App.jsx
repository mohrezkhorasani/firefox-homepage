import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BookmarkGrid from './components/BookmarkGrid';
import BookmarkModal from './components/BookmarkModal';
import TagFilter from './components/TagFilter';
import BottomNav from './components/BottomNav';
import ToolsPage from './components/ToolsPage';
import TodoWidget from './components/TodoWidget';
import MarketWidget from './components/MarketWidget';
import ApiMonitorWidget from './components/ApiMonitorWidget';
import { DEFAULT_BOOKMARKS } from './data/defaultBookmarks';
import { DEFAULT_TAGS } from './data/defaultTags';

const BACKGROUNDS = ['background1.jpg', 'background2.jpg', 'background3.jpg'];

export default function App() {
  const [currentBg, setCurrentBg] = useState(() => {
    return localStorage.getItem('user_bg') || BACKGROUNDS[0];
  });

  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem('homepage_pages');
    return saved ? JSON.parse(saved) : [
      { id: 'home', name: 'Home', icon: 'Home' },
      { id: 'tools', name: 'Tools', icon: 'Wrench' }
    ];
  });
  const [activePage, setActivePage] = useState('home');

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('homepage_bookmarks');
    return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
  });

  const [tags, setTags] = useState(() => {
    const saved = localStorage.getItem('homepage_tags_v2');
    return saved ? JSON.parse(saved) : DEFAULT_TAGS;
  });
  const [activeTag, setActiveTag] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  useEffect(() => {
    document.body.style.backgroundImage = `url('${currentBg}')`;
    localStorage.setItem('user_bg', currentBg);
  }, [currentBg]);

  useEffect(() => {
    localStorage.setItem('homepage_pages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem('homepage_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('homepage_tags_v2', JSON.stringify(tags));
  }, [tags]);

  function nextBackground() {
    const currIdx = BACKGROUNDS.indexOf(currentBg);
    const nextIdx = (currIdx + 1) % BACKGROUNDS.length;
    setCurrentBg(BACKGROUNDS[nextIdx]);
  }

  function handleSaveBookmark(bm) {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === bm.id);
      if (exists) {
        return prev.map((b) => (b.id === bm.id ? bm : b));
      } else {
        return [...prev, bm];
      }
    });
  }

  function handleDeleteBookmark(id) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleUpdateBookmarkColor(id, color) {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, customBgColor: color } : b))
    );
  }

  function handleUpdateBookmarkLogo(id, logoUrl) {
    setBookmarks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (!logoUrl) {
          return { ...b, iconType: 'lucide', iconValue: 'Bookmark' };
        }
        return { ...b, iconType: 'image', iconValue: logoUrl };
      })
    );
  }

  function openAddModal() {
    setEditingBookmark(null);
    setIsModalOpen(true);
  }

  function openEditModal(bm) {
    setEditingBookmark(bm);
    setIsModalOpen(true);
  }

  function handleAddPage(newPage) {
    setPages([...pages, newPage]);
    setActivePage(newPage.id);
  }

  function handleRemovePage(pageId) {
    setPages(pages.filter((p) => p.id !== pageId));
    if (activePage === pageId) {
      setActivePage('home');
    }
  }

  const pageBookmarks = bookmarks.filter((bm) => {
    const bmPage = bm.page || 'home';
    if (activePage === 'tools') return false;
    return bmPage === activePage;
  });

  return (
    <div className="min-h-screen text-white p-4 md:p-8 overflow-x-hidden pb-24">
      {/* Background Change Button */}
      <button 
        onClick={nextBackground}
        className="fixed top-4 left-4 glass p-3 rounded-full text-white z-50 hover:scale-110 transition" 
        title="تغییر پس‌زمینه"
      >
        <i className="fas fa-image text-xl"></i>
      </button>

      {/* Top-Right API Monitor Widget */}
      <ApiMonitorWidget />

      {/* Center Content Wrapper: width reduced strictly from the right side */}
      <div className="xl:mr-[345px] max-w-7xl transition-all">
        {/* Header */}
        <Header />

        {/* Main Grid */}
        <main className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 text-shadow">
          {activePage === 'tools' ? (
            <div className="lg:col-span-3">
              <ToolsPage pages={pages} onRemovePage={handleRemovePage} />
            </div>
          ) : (
            <>
              {/* Sites Section (Left 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <BookmarkGrid
                  bookmarks={pageBookmarks}
                  activeTag={activeTag}
                  onEditBookmark={openEditModal}
                  onAddNew={openAddModal}
                  onDeleteBookmark={handleDeleteBookmark}
                  onUpdateBookmarkColor={handleUpdateBookmarkColor}
                  onUpdateBookmarkLogo={handleUpdateBookmarkLogo}
                />
              </div>

              {/* Sidebar (Right 1 col: Market & Todo) */}
              <div className="space-y-6">
                <MarketWidget />
                <TodoWidget />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Bottom Right: Tag Filters */}
      {activePage !== 'tools' && (
        <TagFilter
          tags={tags}
          activeTag={activeTag}
          onSelectTag={setActiveTag}
        />
      )}

      {/* Bottom Left: Navigation Menu */}
      <BottomNav
        pages={pages}
        activePage={activePage}
        onSelectPage={setActivePage}
        onAddPage={handleAddPage}
      />

      {/* Add / Edit Bookmark Modal */}
      <BookmarkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookmark={editingBookmark}
        onSave={handleSaveBookmark}
        onDelete={handleDeleteBookmark}
        allTags={tags}
        activePage={activePage}
      />
    </div>
  );
}
