import styles from './modal.module.css';

export default function Modal({ children, setShown }) {
  return (
    <div className={styles.modalContainer}>
      <div className={styles.shim} onClick={() => setShown(false)}></div>
      <div className={styles.modal}>{children}</div>
    </div>
  );
}
