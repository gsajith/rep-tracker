'use client';
import ThemeButton from '@/components/themeButton';
import { useTheme } from '@/context/themeProvider';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { useLoadDelay } from '@/hooks/useLoadDelay';
import { browserStorage, writeStickyValue } from '@/hooks/useStickyState';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const { themeName, setThemeName, allThemeNames } = useTheme();
  const router = useRouter();

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
          Color style:
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
        <div className={styles.tour}>
          <div>
            <div className={styles.tourTitle}>Guided tour</div>
            <p className={styles.tourBody}>
              Walks through starting a workout, adding an exercise, and where
              last time&apos;s numbers turn up.
            </p>
          </div>
          <button
            type="button"
            className={styles.replayButton}
            onClick={() => {
              // Written straight to storage rather than through
              // useStickyState: this navigates away in the same tick, and
              // that hook writes from an effect that may never get to run.
              writeStickyValue('tourStatus', 'act1', browserStorage());
              router.push('/');
            }}
          >
            Replay
          </button>
        </div>
      </div>
    )
  );
}
