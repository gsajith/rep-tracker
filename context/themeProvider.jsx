'use client';
import { useStickyState } from '@/hooks/useStickyState';
import { createContext, useContext, useEffect } from 'react';

const ALL_THEME_NAMES = ['purple-green', 'blue-orange', 'blue-dark'];

export const ThemeContext = createContext({
  themeName: 'default',
  setThemeName: () => {},
  allThemeNames: ALL_THEME_NAMES,
});

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useStickyState('default', 'theme-name');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider
      value={{ themeName, setThemeName, allThemeNames: ALL_THEME_NAMES }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
