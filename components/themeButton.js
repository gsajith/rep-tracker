'use client';
import classNames from 'classnames';
import styles from './themeButton.module.css';
import { LetsIconsDoneRound } from './SVGIcons/LetsIconsDoneRound';

export default function ThemeButton({ active, ...rest }) {
  return (
    <button
      className={classNames(styles.themeButtonContainer, {
        [`${styles.active}`]: active,
      })}
      {...rest}
    >
      {active && (
        <LetsIconsDoneRound
          style={{ zIndex: 2, position: 'absolute', left: '17px', top: -1 }}
        />
      )}

      <div className={styles.themeButtonAccent} />
      <div className={styles.themeButtonSecondary} />
    </button>
  );
}
