import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExpandedMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const menuCategories = [
    {
      title: 'Topics',
      items: [
        { name: 'Politics', path: '/politics' },
        { name: 'World', path: '/world' },
        { name: 'Business', path: '/business' },
        { name: 'Technology', path: '/technology' },
        { name: 'Science', path: '/science' },
        { name: 'Health', path: '/health' },
        { name: 'Sports', path: '/sports' },
        { name: 'Entertainment', path: '/entertainment' }
      ]
    },
    {
      title: 'Features',
      items: [
        { name: 'Sources', path: '/sources' },
        { name: 'Bias Analysis', path: '/bias-methodology' },
        { name: 'Fact Checker', path: '/fact-check' },
        { name: 'Trending', path: '/trending' }
      ]
    },
    {
      title: 'Account',
      items: [
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
        { name: 'Privacy', path: '/privacy' },
        { name: 'Terms', path: '/terms' }
      ]
    }
  ];

  const handleItemClick = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-surface-elevated-light dark:bg-surface-elevated-dark shadow-2xl z-[70] transform transition-transform duration-300 ease-out ${
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
        <div className="p-6 border-t border-primary-200/20 dark:border-primary-700/20 bg-surface-light dark:bg-surface-dark">
          <button
            onClick={() => document.documentElement.classList.toggle('dark')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-400 touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="text-sm font-medium">Toggle Dark Mode</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ExpandedMenu;
