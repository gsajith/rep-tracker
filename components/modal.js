'use client';
import { useEffect, useRef } from 'react';
import styles from './modal.module.css';

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Modal({ children, setShown, label }) {
  const dialogRef = useRef(null);

  // Held in a ref, and the effect below runs on mount only. Callers pass an
  // inline arrow for setShown, so its identity changes on every render; with it
  // in the dependency array the effect re-ran on every keystroke and dragged
  // focus back to the first button in the dialog, which made any input inside
  // one impossible to type in.
  const setShownRef = useRef(setShown);
  setShownRef.current = setShown;

  useEffect(() => {
    const dialog = dialogRef.current;
    // Where focus was before the dialog opened, so it can be handed back.
    const opener = document.activeElement;

    const focusable = () => [...dialog.querySelectorAll(FOCUSABLE)];
    (focusable()[0] ?? dialog).focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShownRef.current(false);
        return;
      }
      if (event.key !== 'Tab') return;

      // Without this, Tab walks straight out of the dialog and onto the page
      // behind the shim, where the controls are still live but invisible.
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement) opener.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.modalContainer}>
      <div
        className={styles.shim}
        aria-hidden="true"
        onClick={() => setShown(false)}
      ></div>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={label ? 'modal-title' : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        {label && (
          <h2 className={styles.modalTitle} id="modal-title">
            {label}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
