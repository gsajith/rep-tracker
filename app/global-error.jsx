'use client';
import { useEffect } from 'react';

// Catches a throw from the root layout itself, which app/error.jsx sits inside
// and therefore cannot catch. ThemeProvider is mounted there and reads
// localStorage through useStickyState, so this is the boundary that covers the
// failure this issue describes.
//
// It replaces the entire document, so it renders its own <html> and <body>, and
// it cannot rely on globals.css or the theme variables: the layout that loads
// them is the thing that failed. Hence literal colours, taken from the default
// theme in app/globals.css.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          background: '#ECEFF3',
          color: '#1D1226',
        }}
      >
        <div style={{ maxWidth: 320, margin: '48px auto' }} role="alert">
          <h2 style={{ margin: '0 0 12px', fontSize: 20, color: '#ac2746' }}>
            Rep Tracker failed to load
          </h2>
          <p style={{ margin: '0 0 16px' }}>
            Your saved workouts are on the server and are not affected.
          </p>
          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              borderRadius: 14,
              background: '#A462D8',
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <p style={{ margin: '16px 0 0', fontSize: 14, color: '#908E96' }}>
            If this keeps happening, clearing this site&apos;s data in your
            browser settings will reset the app.
          </p>
        </div>
      </body>
    </html>
  );
}
