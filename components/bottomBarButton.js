import classNames from 'classnames';
import styles from './bottomBarButton.module.css';

export default function BottomBarButton({ children, active, ...rest }) {
  return (
    <button
      className={classNames(styles.button, { [`${styles.active}`]: active })}
      {...rest}
    >
      {children}
    </button>
  );
}
