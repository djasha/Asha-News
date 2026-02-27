import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const getInitialPreference = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const savedTheme = window.localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
  } catch (error) {
    // ignore storage errors and fall back to media query
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(getInitialPreference);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const value = {
    isDark,
    toggleTheme,
    // Aliases for existing components
    isDarkMode: isDark,
    toggleDarkMode: toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
