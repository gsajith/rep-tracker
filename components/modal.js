import styles from './modal.module.css';
import { LetsIconsTrash } from './SVGIcons/LetsIconsTrash';

export default function Modal({ children, setShown }) {
  return (
    <div className={styles.modalContainer}>
      <div className={styles.shim} onClick={() => setShown(false)}></div>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <LetsIconsTrash onClick={() => setShown(false)} />
        </div>
        {children}
      </div>
    </div>
  );
}
