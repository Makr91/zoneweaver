import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Theme options: 'auto', 'light', 'dark'
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('zoneweaver-theme');
    console.log('🎨 THEME: ThemeProvider initializing', { savedTheme, fallback: savedTheme || 'auto' });
    return savedTheme || 'auto';
  });

  // Debug theme state changes
  console.log('🎨 THEME: Current theme state:', theme);

  // Apply theme to HTML element
  useEffect(() => {
    console.log('🎨 THEME: useEffect running, theme:', theme);
    const html = document.documentElement;
    
    // Always clear existing theme classes first
    html.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'auto') {
      // For auto mode, check system preference and apply appropriate data-theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const activeTheme = prefersDark ? 'dark' : 'light';
      console.log('🎨 THEME: Auto mode detected system theme:', activeTheme);
      html.setAttribute('data-theme', activeTheme);
      html.classList.add(`theme-${activeTheme}`);
    } else {
      // Apply specific theme
      console.log('🎨 THEME: Applying specific theme:', theme);
      html.setAttribute('data-theme', theme);
      html.classList.add(`theme-${theme}`);
    }
    
    // Save preference
    localStorage.setItem('zoneweaver-theme', theme);
    console.log('🎨 THEME: Applied to DOM - data-theme:', html.getAttribute('data-theme'), 'classes:', html.className);
    
    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const activeTheme = e.matches ? 'dark' : 'light';
        html.setAttribute('data-theme', activeTheme);
        html.classList.remove('theme-light', 'theme-dark');
        html.classList.add(`theme-${activeTheme}`);
      };
      
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    console.log('🎨 THEME: toggleTheme called, current theme:', theme);
    setTheme(current => {
      const newTheme = current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto';
      console.log('🎨 THEME: Theme changing from', current, 'to', newTheme);
      return newTheme;
    });
  };

  const setSpecificTheme = (newTheme) => {
    if (['auto', 'light', 'dark'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const getThemeDisplay = () => {
    if (theme === 'auto') {
      // Check if system prefers dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return `Auto (${prefersDark ? 'Dark' : 'Light'})`;
    }
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  const value = {
    theme,
    setTheme: setSpecificTheme,
    toggleTheme,
    getThemeDisplay
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
