import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const MobileHeader = ({ isMenuOpen, onMenuToggle, isSearchOpen, onSearchToggle }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // Hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        setIsScrolled(true);
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY) {
          setIsHeaderVisible(true);
        }
      } else {
        setIsScrolled(false);
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false);
      setSearchQuery('');
    }
  };

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => {
        document.getElementById('mobile-search-input')?.focus();
      }, 100);
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled 
          ? 'bg-surface-elevated-light/95 dark:bg-surface-elevated-dark/95 backdrop-blur-md shadow-mobile-lg' 
          : 'bg-surface-light dark:bg-surface-dark'
      }`}
    >
      {/* Main Header Bar */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-primary-200/20 dark:border-primary-700/20">
        {/* Left: Menu Button */}
        <button
          onClick={onMenuToggle}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <div className="relative w-5 h-5">
            <span className={`absolute block w-5 h-0.5 bg-text-primary-light dark:bg-text-primary-dark transition-all duration-300 ${
              isMenuOpen ? 'rotate-45 top-2' : 'top-1'
            }`} />
            <span className={`absolute block w-5 h-0.5 bg-text-primary-light dark:bg-text-primary-dark transition-all duration-300 top-2 ${
              isMenuOpen ? 'opacity-0' : 'opacity-100'
            }`} />
            <span className={`absolute block w-5 h-0.5 bg-text-primary-light dark:bg-text-primary-dark transition-all duration-300 ${
              isMenuOpen ? '-rotate-45 top-2' : 'top-3'
            }`} />
          </div>
        </button>

        {/* Center: Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 touch-manipulation"
        >
          <div className="text-xl font-logo font-semibold text-text-primary-light dark:text-text-primary-dark">
            Asha<span className="text-primary-500 dark:text-primary-400">.</span>News
          </div>
        </button>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearchToggle}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
            aria-label="Search articles"
          >
            <svg className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <button
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
            aria-label="User account"
          >
            <svg className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchExpanded && (
        <div className="bg-surface-light dark:bg-surface-dark border-b border-primary-200/20 dark:border-primary-700/20 animate-slide-down">
          <form onSubmit={handleSearchSubmit} className="p-4">
            <div className="relative">
              <input
                id="mobile-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full h-12 pl-12 pr-4 bg-surface-elevated-light dark:bg-surface-elevated-dark border border-primary-200 dark:border-primary-700 rounded-mobile text-text-primary-light dark:text-text-primary-dark placeholder-text-tertiary-light dark:placeholder-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all touch-manipulation"
                autoComplete="off"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
