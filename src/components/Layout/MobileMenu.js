import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const menuItems = [
    { path: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/search', label: 'Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { path: '/blindspots', label: 'Blindspots', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { path: '/sources', label: 'Sources', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { path: '/bias-methodology', label: 'How We Analyze', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { path: '/about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-surface-elevated-light dark:bg-surface-elevated-dark z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-200/20 dark:border-primary-700/20">
          <div className="text-2xl font-logo font-bold text-text-primary-light dark:text-text-primary-dark mb-8">
            Asha<span className="text-primary-600 dark:text-primary-400">.</span>News
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="py-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors touch-manipulation ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-2 border-primary-600 dark:border-primary-400' 
                    : 'text-text-primary-light dark:text-text-primary-dark hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Menu Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-200/20 dark:border-primary-700/20">
          <div className="flex items-center justify-between">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                document.documentElement.classList.toggle('dark');
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
              aria-label="Toggle dark mode"
            >
              <svg className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Dark Mode
              </span>
            </button>

            {/* Sign In Button */}
            <button className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 active:bg-primary-800 dark:active:bg-primary-700 transition-colors font-medium text-sm touch-manipulation">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
