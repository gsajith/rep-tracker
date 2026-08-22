import React from 'react';

// The read and write halves are plain functions taking a storage object rather
// than reaching for `window` themselves, so the behaviour that caused this bug
// can be executed directly without a React renderer.

export function readStickyValue(key, defaultValue, storage) {
  if (!storage) return defaultValue;

  try {
    const stored = storage.getItem(key);
    // Compare against null only when there is real storage. The old code did
    // `typeof window !== 'undefined' && getItem(key)`, which is `false` on the
    // server, and `false !== null` passes, so it returned JSON.parse(false),
    // which is `false`. The default was unreachable during server rendering.
    return stored === null ? defaultValue : JSON.parse(stored);
  } catch {
    // Either the stored string is not JSON, or getItem itself threw. Some
    // browsers throw on storage access rather than returning null.
    return defaultValue;
  }
}

export function writeStickyValue(key, value, storage) {
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded, or Safari private browsing. Losing persistence is worth
    // strictly less than taking the whole render down.
    return false;
  }
}

// Accessing window.localStorage can itself throw when site data is blocked, so
// even reaching for it is guarded.
function browserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const useStickyState = (defaultValue, key) => {
  const [value, setValue] = React.useState(() =>
    readStickyValue(key, defaultValue, browserStorage())
  );

  React.useEffect(() => {
    writeStickyValue(key, value, browserStorage());
  }, [key, value]);

  return [value, setValue];
};
