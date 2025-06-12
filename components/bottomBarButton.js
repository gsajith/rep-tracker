import classNames from 'classnames';
import styles from './bottomBarButton.module.css';
import Link from 'next/link';
import { forwardRef } from 'react';

const BottomBarButton = forwardRef(function BottomBarButton(props, ref) {
  const { children, active, href, ...rest } = props;
  return (
    <Link
      href={href}
      className={classNames(styles.button, { [`${styles.active}`]: active })}
      ref={ref}
      {...rest}
    >
      {children}
    </Link>
  );
});

export default BottomBarButton;
