import classNames from 'classnames';
import styles from './bottomBarButton.module.css';
import Link from 'next/link';

export default function BottomBarButton({ children, active, href, label }) {
  return (
    <Link
      href={href}
      className={classNames(styles.tab, { [styles.active]: active })}
      aria-current={active ? 'page' : undefined}
    >
      {children}
      {/* The label rides along only on the selected tab, the way the reference
          dock does it. The other two keep their accessible name here. */}
      {active ? (
        <span className={styles.label}>{label}</span>
      ) : (
        <span className={styles.srOnly}>{label}</span>
      )}
    </Link>
  );
}
