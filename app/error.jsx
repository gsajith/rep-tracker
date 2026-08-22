'use client';
import { useEffect } from 'react';
import styles from './error.module.css';

// Route-level error boundary. Without one, a throw during render leaves the
// production build showing Next's bare "Application error: a client-side
// exception has occurred" with no way back, which for an installed PWA means
// clearing site data.
export default function Error({ error, reset }) {
  useEffect(() => {
    // console.error survives the production build; see the removeConsole
    // exclude in next.config.mjs.
    console.error('Route error boundary caught:', error);
  }, [error]);

  return (
    <div className={styles.container} role="alert">
      <h2 className={styles.heading}>This page ran into an error</h2>
      <p className={styles.body}>
        Your saved workouts are on the server and are not affected. A workout
        you were part way through is still on this device.
      </p>
      <button className={styles.retry} onClick={reset}>
        Try again
      </button>
      <p className={styles.hint}>
        If this keeps happening, clearing this site&apos;s data in your browser
        settings will reset the app.
      </p>
    </div>
  );
}
