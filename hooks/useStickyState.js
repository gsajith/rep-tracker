import React from 'react';

// The read and write halves are plain functions taking a storage object rather
// than reaching for `window` themselves, so the behaviour that caused this bug
// can be executed directly without a React renderer.

// `isValid` is optional. Pass one for a key whose value is structured enough
// that the wrong shape would crash a render.
export function readStickyValue(key, defaultValue, storage, isValid) {
  if (!storage) return defaultValue;

  try {
    const stored = storage.getItem(key);
    // Compare against null only when there is real storage. The old code did
    // `typeof window !== 'undefined' && getItem(key)`, which is `false` on the
    // server, and `false !== null` passes, so it returned JSON.parse(false),
    // which is `false`. The default was unreachable during server rendering.
    if (stored === null) return defaultValue;

    const parsed = JSON.parse(stored);

    // Parsing is not the same as being usable. JSON.parse returns whatever was
    // stored, and a value of the wrong shape then crashes the render. The
    // boundary added in #11 catches that, but the bad value is still in storage
    // on the next load, so the page stays broken until site data is cleared.
    // Falling back here costs the stored value and keeps the app working.
    if (isValid && !isValid(parsed)) {
      console.error(
        `useStickyState: stored "${key}" is not the expected shape, using default.`
      );
      return defaultValue;
    }

    return parsed;
  } catch (error) {
    // Either the stored string is not JSON, or getItem itself threw. Some
    // browsers throw on storage access rather than returning null.
    //
    // Logged rather than swallowed: falling back is silent to the user by
    // design, and the effect below then writes the default over whatever was
    // there, so without this line the corrupt value is destroyed leaving no
    // evidence it ever existed. console.error survives production builds.
    //
    // Note for whenever error reporting gets added: V8 puts a fragment of the
    // input into a JSON.parse SyntaxError, so `error` carries part of the
    // stored value. Harmless in the user's own console with the user's own
    // data; it would need scrubbing before being shipped anywhere.
    console.error(`useStickyState: could not read "${key}", using default.`, error);
    return defaultValue;
  }
}

export function writeStickyValue(key, value, storage) {
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // Quota exceeded, or Safari private browsing. Losing persistence is worth
    // strictly less than taking the whole render down, but it should not be
    // invisible: from here the in-progress workout is no longer being saved.
    console.error(`useStickyState: could not write "${key}".`, error);
    return false;
  }
}

// Accessing window.localStorage can itself throw when site data is blocked, so
// even reaching for it is guarded.
function browserStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.error('useStickyState: localStorage is unavailable.', error);
    return null;
  }
}

export const useStickyState = (defaultValue, key, isValid) => {
  const [value, setValue] = React.useState(() =>
    readStickyValue(key, defaultValue, browserStorage(), isValid)
  );

  React.useEffect(() => {
    writeStickyValue(key, value, browserStorage());
  }, [key, value]);

  return [value, setValue];
};
