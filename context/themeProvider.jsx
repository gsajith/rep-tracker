'use client';
import { useStickyState } from '@/hooks/useStickyState';
import { createContext, useContext, useEffect } from 'react';

const ALL_THEME_NAMES = [
  'purple-green',
  'blue-orange',
  'blue-dark',
  'red-dark',
  'cosmo-wanda',
  'green-dark',
];

export const ThemeContext = createContext({
  themeName: 'default',
  setThemeName: () => {},
  allThemeNames: ALL_THEME_NAMES,
});

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [storedThemeName, setThemeName] = useStickyState(
    'default',
    'theme-name'
  );

  // "default" and "purple-green" are the same palette: globals.css defines them
  // in one block. Only "purple-green" is in ALL_THEME_NAMES, so a stored
  // "default" matched none of the six swatches and the settings picker showed
  // no active selection at all until the user tapped something. Normalising on
  // read fixes that for existing installs without touching the CSS.
  const themeName =
    storedThemeName === 'default' ? 'purple-green' : storedThemeName;

  const resetThemeColor = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    let themeColor = rootStyles.getPropertyValue('--background').trim();

    if (themeColor.length < 3) {
      themeColor = '#ECEFF3';
    }

    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', themeColor);
  };

  // Deliberately not called during render: this touches document/getComputedStyle,
  // which do not exist while Next server-renders this component. The mount effect
  // below already applies the colour as soon as there is a DOM to apply it to.
  useEffect(() => {
    resetThemeColor();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);

    resetThemeColor();
    setTimeout(() => {
      resetThemeColor();
    }, 100);
    setTimeout(() => {
      resetThemeColor();
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
