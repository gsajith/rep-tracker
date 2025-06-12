import classNames from 'classnames';
import styles from './bottomBarButton.module.css';
import Link from 'next/link';

export default function BottomBarButton({ children, active, href, ...rest }) {
  return (
    <Link
      href={href}
      className={classNames(styles.button, { [`${styles.active}`]: active })}
      {...rest}
    >
      {children}
    </Link>
  );
}
