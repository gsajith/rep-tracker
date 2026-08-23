'use client';
import classNames from 'classnames';
import styles from './themeButton.module.css';
import { LetsIconsDoneRound } from './SVGIcons/LetsIconsDoneRound';

export default function ThemeButton({ active, label, ...rest }) {
  return (
    <button
      className={classNames(styles.themeButtonContainer, {
        [`${styles.active}`]: active,
      })}
      // Six identical unnamed buttons announced as "button" six times, with the
      // selected one distinguishable only by colour.
      aria-label={label}
      aria-pressed={!!active}
      type="button"
      {...rest}
    >
      {/* The clipping that shapes the diagonal halves into a pill lives on this
          inner element now, so the button itself can be a 44px target and the
          confirming check is no longer cut off by it. */}
      <span className={styles.swatch}>
        <span className={styles.themeButtonAccent} />
        <span className={styles.themeButtonSecondary} />
      </span>
      {active && <LetsIconsDoneRound className={styles.activeCheck} />}
    </button>
  );
}
