'use client';
import ThemeButton from '@/components/themeButton';
import { useTheme } from '@/context/themeProvider';
import styles from './page.module.css';

export default function Settings() {
  const { themeName, setThemeName, allThemeNames } = useTheme();

  return (
    <div className={styles.container}>
      <h2>Settings</h2>
      <div className={styles.themeSelector}>
        Color Theme:
        <div className={styles.themeList}>
          {allThemeNames.map((theme) => (
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
  );
}
