'use client';
import { useEffect, useState } from 'react';

export const useLoadDelay = (delay = 0) => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShown(true);
    }, delay);
  }, []);

  return shown;
};
