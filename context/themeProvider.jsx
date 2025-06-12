'use client';
import { useStickyState } from '@/hooks/useStickyState';
import { createContext, useContext, useEffect } from 'react';

export const ThemeContext = createContext({ setThemeName: () => {} });

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useStickyState('default', 'theme-name');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
};
