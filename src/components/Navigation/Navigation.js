import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-responsive-headline font-bold text-primary-600 dark:text-primary-500">
                Asha.News
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a
                href="/"
                className="text-text-primary-light dark:text-text-primary-dark hover:text-primary-600 dark:hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </a>
              <a
                href="/sources"
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sources
              </a>
              <a
                href="/fact-check"
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Fact Checker
              </a>
              <a
                href="/about"
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-500 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </a>
            </div>
          </div>

          {/* Theme Toggle & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-surface-light dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-surface-light dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                    <div className="w-5 h-0.5 bg-current rounded-full"></div>
                    <div className="w-6 h-0.5 bg-current rounded-full"></div>
                    <div className="w-4 h-0.5 bg-current rounded-full"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-slide-in">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700">
            <a
              href="/"
              className="text-text-primary-light dark:text-text-primary-dark hover:text-primary-600 dark:hover:text-primary-500 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Home
            </a>
            <a
              href="/sources"
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-500 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Sources
            </a>
            <a
              href="/fact-check"
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-500 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Fact Checker
            </a>
            <a
              href="/about"
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary-600 dark:hover:text-primary-500 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              About
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
