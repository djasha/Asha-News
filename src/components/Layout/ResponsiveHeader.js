import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExpandedMenu from "./ExpandedMenu";
import TrendingTopicsBar from "./TrendingTopicsBar";
import { useAuth } from "../../contexts/AuthContext";
import AuthModal from "../Auth/AuthModal";
import SubscriptionModal from "../Subscription/SubscriptionModal";
import { useMenuSettings } from "../../hooks/useMenuSettings";
import { useTheme } from "../../contexts/ThemeContext";

const ResponsiveHeader = ({ onMenuToggle, isMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isExpandedMenuOpen, setIsExpandedMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Hide header on scroll down, show on scroll up (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (window.innerWidth < 1024) {
        // Only hide on mobile/tablet
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
      } else {
        setIsScrolled(currentScrollY > 50);
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [lastScrollY]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => {
        document.getElementById("mobile-search-input")?.focus();
      }, 100);
    }
  };

  // Load desktop menu settings with fallback to defaults
  const defaultNav = [
    { label: "Home", path: "/", fontSize: "16", fontWeight: "500" },
    { label: "Stories", path: "/stories", fontSize: "16", fontWeight: "500" },
    { label: "For You", path: "/for-you", fontSize: "16", fontWeight: "500" },
    { label: "Local", path: "/local", fontSize: "16", fontWeight: "500" },
    { label: "Fact Checker", path: "/fact-check", fontSize: "16", fontWeight: "500" },
  ];

  const { data: menuData } = useMenuSettings('desktop');
  
  // Filter enabled items and sort by sort_order
  const navItems = menuData 
    ? menuData
        .filter(item => item.enabled !== false)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : defaultNav;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isHeaderVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isScrolled
          ? "bg-surface-elevated-light/80 dark:bg-surface-elevated-dark/80 backdrop-blur-md shadow-mobile-lg"
          : "bg-surface-light dark:bg-surface-dark"
      } border-b border-border-light/60 dark:border-border-dark/60`}
    >
      {/* Mobile Header (< 1024px) */}
      <div className="lg:hidden flex items-center justify-between h-14 px-4">
        {/* Left: Menu Button */}
        <button
          onClick={() => setIsExpandedMenuOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
          aria-label="Open menu"
        >
          <div className="w-5 h-5 flex flex-col justify-center space-y-1">
            <div className="w-4 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
            <div className="w-5 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
            <div className="w-3 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
          </div>
        </button>

        {/* Center: Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 touch-manipulation"
        >
          <div className="text-xl font-logo font-semibold text-text-primary-light dark:text-text-primary-dark">
            Asha
            <span className="text-primary-600 dark:text-primary-400">.</span>
            News
          </div>
        </button>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearchToggle}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark active:bg-interactive-active-light dark:active:bg-interactive-active-dark transition-colors touch-manipulation"
            aria-label="Search articles"
          >
            <svg
              className="w-5 h-5 text-text-primary-light dark:text-text-primary-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Header (>= 1024px) */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsExpandedMenuOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-transparent hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark transition-colors"
                aria-label="Open menu"
              >
                <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                  <div className="w-4 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                  <div className="w-5 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                  <div className="w-3 h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                </div>
              </button>

              <button
                onClick={() => navigate("/")}
                className="flex items-center"
              >
                <div className="text-2xl font-logo font-medium text-text-primary-light dark:text-text-primary-dark">
                  Asha
                  <span className="text-primary-500 dark:text-primary-400">
                    .
                  </span>
                  News
                </div>
              </button>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="flex items-center space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`transition-colors ${
                      isActive
                        ? "text-primary-500 dark:text-primary-400"
                        : "text-text-primary-light dark:text-text-primary-dark hover:text-primary-500 dark:hover:text-primary-400"
                    }`}
                    style={{
                      fontSize: item.fontSize ? `${item.fontSize}px` : '16px',
                      fontWeight: item.fontWeight || '500'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Search & Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-64 h-10 pl-10 pr-4 bg-surface-elevated-light dark:bg-surface-elevated-dark border border-primary-200 dark:border-primary-700 rounded-lg text-text-primary-light dark:text-text-primary-dark placeholder-text-tertiary-light dark:placeholder-text-tertiary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary-light dark:text-text-tertiary-dark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </form>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark hover:bg-interactive-hover-light dark:hover:bg-interactive-hover-dark transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <svg
                    className="w-5 h-5 text-text-primary-dark"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 5a7 7 0 000 14 7 7 0 000-14z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-text-primary-light"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              {/* Authentication/User Section */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {!user?.subscription && (
                    <button
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium"
                    >
                      Upgrade
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(user?.displayName?.charAt(0) || user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-text-primary-light dark:text-text-primary-dark font-medium">
                      {user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-4 py-2 text-text-primary-light dark:text-text-primary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('register');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 active:bg-primary-800 dark:active:bg-primary-700 transition-colors font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Expandable Search Bar */}
      {isSearchExpanded && (
        <div className="lg:hidden bg-surface-light dark:bg-surface-dark border-b border-primary-200/20 dark:border-primary-700/20 animate-slide-down">
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
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>
        </div>
      )}

      {/* RSS Ticker Bar - Al Jazeera */}
      <div className="bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark py-1 overflow-hidden rss-ticker-container">
        <rssapp-ticker id="nvKmGFUXkqfWuwTc"></rssapp-ticker>
      </div>

      {/* Trending Topics Bar */}
      <TrendingTopicsBar />

      {/* Expanded Menu */}
      <ExpandedMenu
        isOpen={isExpandedMenuOpen}
        onClose={() => setIsExpandedMenuOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </header>
  );
};

export default ResponsiveHeader;
