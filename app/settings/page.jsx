'use client';
import { APPEARANCE_LABELS, useTheme } from '@/context/themeProvider';
import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { useLoadDelay } from '@/hooks/useLoadDelay';
import { browserStorage, writeStickyValue } from '@/hooks/useStickyState';
import { useRouter } from 'next/navigation';
import { useWeightUnit } from '@/context/unitProvider';
import { WEIGHT_UNITS, weightUnitLabel } from '@/utils/units';
import classNames from 'classnames';

// One control shape for the page: a label on the left, a switch on the right.
function Switch({ label, options, value, onChange }) {
  return (
    <div className={styles.switch} role="group" aria-label={label}>
      {options.map(({ id, text }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={classNames(styles.switchButton, {
            [styles.switchButtonActive]: value === id,
          })}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const { appearance, setAppearance, appearances } = useTheme();
  const { unit, setUnit } = useWeightUnit();
  const router = useRouter();

  // The stored appearance is only readable on the client, so the switch waits
  // for mount rather than rendering three unselected positions on the server.
  const [mount, setMount] = useState(false);
  const shown = useLoadDelay();

  useEffect(() => {
    setMount(true);
  }, []);

  return (
    shown && (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Settings</h1>

        <section className={styles.container}>
          <div className={styles.settingRow}>
            <span className={styles.settingTitle}>Appearance</span>
            {mount && (
              <Switch
                label="Appearance"
                value={appearance}
                onChange={setAppearance}
                options={appearances.map((name) => ({
                  id: name,
                  text: APPEARANCE_LABELS[name],
                }))}
              />
            )}
          </div>
        </section>

        <section className={styles.container}>
          <div className={styles.settingRow}>
            <span className={styles.settingTitle}>Weight unit</span>
            {/* No mount gate, unlike the switch above: useLoadDelay already
                holds the whole page back to a later tick than the mount effect,
                so this never renders before the stored choice is readable. */}
            <Switch
              label="Weight unit"
              value={unit}
              onChange={setUnit}
              options={WEIGHT_UNITS.map((name) => ({
                id: name,
                text: weightUnitLabel(name),
              }))}
            />
          </div>
        </section>

        <section className={styles.container}>
          <div className={styles.settingRow}>
            <span className={styles.settingTitle}>Guided tour</span>
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
        </section>
      </div>
    )
  );
}
