'use client';
import ThemeButton from '@/components/themeButton';
import { useTheme } from '@/context/themeProvider';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { useLoadDelay } from '@/hooks/useLoadDelay';

export default function Settings() {
  const { themeName, setThemeName, allThemeNames } = useTheme();

  const [mount, setMount] = useState(false);
  const shown = useLoadDelay();

  useEffect(() => {
    setMount(true);
  }, []);
  return (
    shown && (
      <div className={styles.container}>
        <h2>Settings</h2>
        <div className={styles.themeSelector}>
          Color Theme:
          <div className={styles.themeList}>
            {mount &&
              allThemeNames.map((theme) => (
                <div data-theme={theme} key={theme}>
                  <ThemeButton
                    onClick={() => setThemeName(theme)}
                    active={themeName === theme}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  );
}
