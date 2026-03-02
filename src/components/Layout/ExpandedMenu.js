import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTopics } from '../../hooks/useCMSData';
import { useMenuSettings } from '../../hooks/useMenuSettings';
import useUserRole from '../../hooks/useUserRole';
import { V1_CORE_ONLY, CORE_SIDE_MENU } from '../../config/v1';

const ExpandedMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { isAdmin } = useUserRole();

  // Load topics from CMS with a safe fallback
  const { data: cmsTopics } = useTopics();
  const { data: sideMenuData } = useMenuSettings('side');

  const normalizeTopicPath = (topic) => {
    const slug = topic.slug || (topic.name ? String(topic.name).toLowerCase().replace(/\s+/g, '-') : '');
    return slug ? `/topic/${slug}` : `/${(topic.name || '').toLowerCase()}`;
  };

  const topicItems = Array.isArray(cmsTopics) && cmsTopics.length
    ? cmsTopics
        .filter((t) => t.enabled !== false)
        .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999))
        .slice(0, 12)
        .map((t) => ({ name: t.name || t.slug || 'Topic', path: normalizeTopicPath(t) }))
    : [
      { name: 'Politics', path: '/politics' },
      { name: 'World', path: '/world' },
      { name: 'Business', path: '/business' },
      { name: 'Technology', path: '/technology' },
      { name: 'Science', path: '/science' },
      { name: 'Health', path: '/health' },
      { name: 'Sports', path: '/sports' },
      { name: 'Entertainment', path: '/entertainment' }
    ];

  // Build menu categories from admin settings
  let menuCategories = [];
  
  if (V1_CORE_ONLY) {
    menuCategories = CORE_SIDE_MENU.map((category) => ({
      title: category.title,
      items: category.items.map((item) => ({ name: item.label, path: item.path }))
    }));
    menuCategories.push({
      title: 'Knowledge',
      items: [
        { name: 'Wiki Home', path: '/wiki' },
        { name: 'Conflict Ops Wiki', path: '/wiki/conflict-ops' },
        { name: 'AI Checker Wiki', path: '/wiki/ai-checker' },
        { name: 'Markets Wiki', path: '/wiki/markets' },
        { name: 'Agent API Wiki', path: '/wiki/agent-api' }
      ]
    });
    if (isAdmin) {
      menuCategories.push({
        title: 'Admin',
        items: [{ name: 'Admin Settings', path: '/admin/settings' }]
      });
    }
  } else if (sideMenuData && Array.isArray(sideMenuData)) {
    menuCategories = sideMenuData
      .filter(cat => cat.enabled !== false)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(cat => {
        if (cat.title === 'Topics') {
          return {
            title: cat.title,
            items: topicItems
          };
        } else {
          const items = cat.items || [];
          // Add Admin Settings if user is admin
          const finalItems = cat.title === 'Features' && isAdmin
            ? [...items, { label: 'Admin Settings', path: '/admin/settings', enabled: true }]
            : items;
          return {
            title: cat.title,
            items: finalItems
              .filter(item => item.enabled !== false)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map(item => ({ name: item.label, path: item.path }))
          };
        }
      });
  } else {
    // Fallback
    const featureItems = [
      { name: 'Sources', path: '/sources' },
      { name: 'Bias Analysis', path: '/bias-methodology' },
      { name: 'Fact Checker', path: '/fact-check' },
      { name: 'Trending', path: '/trending' }
    ];
    // Only show admin settings to admin users
    if (isAdmin) {
      featureItems.push({ name: 'Admin Settings', path: '/admin/settings' });
    }
    menuCategories = [
      { title: 'Topics', items: topicItems },
      { title: 'Features', items: featureItems }
    ];
  }

  const handleItemClick = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      
      {/* Menu Panel */}
      <div className={`fixed top-0 left-0 h-screen w-80 max-w-[85vw] bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-2xl z-[70] transform transition-transform duration-300 ease-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200/20 dark:border-primary-700/20 bg-surface-light dark:bg-surface-dark">
          <div className="text-xl font-serif font-semibold text-text-primary-light dark:text-text-primary-dark">
            Menu
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 overflow-y-auto bg-surface-elevated-light dark:bg-surface-elevated-dark">
          <div className="p-6 space-y-8">
            {menuCategories.map((category) => (
              <div key={category.title} className="space-y-4">
                <h3 className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest px-2">
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleItemClick(item.path)}
                      className="w-full text-left px-4 py-3 rounded-lg text-text-primary-light dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 font-medium touch-manipulation group"
                    >
                      <span className="block text-base leading-tight group-hover:translate-x-1 transition-transform duration-200">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Footer */}
        <div className="flex-shrink-0 p-6 border-t border-primary-200/20 dark:border-primary-700/20 bg-surface-light dark:bg-surface-dark space-y-2">
          <button
            onClick={() => document.documentElement.classList.toggle('dark')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="text-sm font-medium">Toggle Dark Mode</span>
          </button>
          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-red-600 dark:hover:text-red-400 touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpandedMenu;
