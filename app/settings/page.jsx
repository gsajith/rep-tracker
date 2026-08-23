'use client';
import ThemeButton from '@/components/themeButton';
import { useTheme } from '@/context/themeProvider';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { useLoadDelay } from '@/hooks/useLoadDelay';
import { browserStorage, writeStickyValue } from '@/hooks/useStickyState';
import { useRouter } from 'next/navigation';
import { useWeightUnit } from '@/context/unitProvider';
import { WEIGHT_UNITS, weightUnitLabel } from '@/utils/units';
import classNames from 'classnames';

// "blue-orange" reads as "Blue orange" rather than being announced as the
// slug, or as nothing at all, which is what six unnamed buttons did before.
const themeLabel = (name) => {
  const words = name.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function Settings() {
  const { themeName, setThemeName, allThemeNames } = useTheme();
  const { unit, setUnit } = useWeightUnit();
  const router = useRouter();

  const [mount, setMount] = useState(false);
  const shown = useLoadDelay();

  useEffect(() => {
    setMount(true);
  }, []);
  return (
    shown && (
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <div className={styles.themeSelector}>
          Color style:
          <div className={styles.themeList}>
            {mount &&
              allThemeNames.map((theme) => (
                <div data-theme={theme} key={theme}>
                  <ThemeButton
                    onClick={() => setThemeName(theme)}
                    active={themeName === theme}
                    label={themeLabel(theme)}
                  />
                </div>
              ))}
          </div>
        </div>
        <div className={styles.unitSelector}>
          <div>
            <div className={styles.settingTitle}>Weight unit</div>
            <p className={styles.settingBody}>
              Everything already logged was recorded in pounds and gets
              converted for display. Switching changes what you see, not what
              you lifted.
            </p>
          </div>
          {/* Same mount gate as the theme swatches: the stored choice is not
              known until localStorage can be read, and pressed state that
              flips after hydration is worse than a beat of nothing. */}
          {mount && (
            <div
              className={styles.unitChoices}
              role="group"
              aria-label="Weight unit"
            >
              {WEIGHT_UNITS.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={unit === name}
                  onClick={() => setUnit(name)}
                  className={classNames(styles.unitButton, {
                    [`${styles.unitButtonActive}`]: unit === name,
                  })}
                >
                  {weightUnitLabel(name)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.tour}>
          <div>
            <div className={styles.settingTitle}>Guided tour</div>
            <p className={styles.settingBody}>
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
