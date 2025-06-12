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

    setTimeout(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const themeColor = rootStyles.getPropertyValue('--background').trim();

      let metaTag = document.querySelector('meta[name="theme-color"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTag);
      }

      metaTag.setAttribute('content', themeColor);
    }, 250);
  }, [themeName]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const newColor = rootStyles.getPropertyValue('--background').trim();

      let metaTag = document.querySelector('meta[name="theme-color"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTag);
      }

      metaTag.setAttribute('content', newColor);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ThemeContext.Provider
      value={{ themeName, setThemeName, allThemeNames: ALL_THEME_NAMES }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
