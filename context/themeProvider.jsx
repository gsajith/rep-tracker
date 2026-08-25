'use client';
import { useStickyState } from '@/hooks/useStickyState';
import { createContext, useContext, useEffect } from 'react';

// Light, dark, or whatever the phone is set to. Replaces seven named colour
// palettes with one brand in two renditions.
export const APPEARANCES = ['system', 'light', 'dark'];

export const APPEARANCE_LABELS = {
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
};

export const ThemeContext = createContext({
  appearance: 'system',
  setAppearance: () => {},
  appearances: APPEARANCES,
});

export const useTheme = () => useContext(ThemeContext);

// The address bar and the PWA splash take a literal colour rather than a
// variable. Kept in step with --bg in globals.css by hand.
const GROUND = { light: '#f4f3fa', dark: '#14102a' };

export const ThemeProvider = ({ children }) => {
  const [appearance, setAppearance] = useStickyState('system', 'appearance');

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      // On 'system' the attribute comes off entirely, which hands the decision
      // back to the media query in globals.css rather than duplicating it here.
      if (appearance === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', appearance);
      }

      const resolved =
        appearance === 'system'
          ? media.matches
            ? 'dark'
            : 'light'
          : appearance;

      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', GROUND[resolved]);
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [appearance]);

  return (
    <ThemeContext.Provider
      value={{ appearance, setAppearance, appearances: APPEARANCES }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
