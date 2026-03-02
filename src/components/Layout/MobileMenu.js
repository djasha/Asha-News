import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CORE_NAV_ITEMS_DESKTOP } from '../../config/v1';

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

  const menuItems = CORE_NAV_ITEMS_DESKTOP.map((item) => ({
    label: item.label,
    path: item.path,
    icon: item.path === '/'
      ? 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
      : item.path === '/ai-checker'
        ? 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
        : item.path === '/markets'
          ? 'M3 3v18h18M7 14l3-3 3 2 4-5'
          : 'M7 3h8l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z',
  }));

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
            const isActive = location.pathname === item.path || (
              item.path === '/ai-checker' && location.pathname === '/fact-check'
            );
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
