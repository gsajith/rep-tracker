import classNames from 'classnames';
import styles from './themeButton.module.css';

export default function ThemeButton({ active, ...rest }) {
  return (
    <button
      className={classNames(styles.themeButtonContainer, {
        [`${styles.active}`]: active,
      })}
      {...rest}
    >
      <div className={styles.themeButtonAccent} />
      <div className={styles.themeButtonSecondary} />
    </button>
  );
}
