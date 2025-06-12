'use client';
import { useEffect } from 'react';
import Head from 'next/head';

export default function ThemeMetaColor() {
  const resetTheme = () => {};

  setTimeout(() => resetTheme(), 100);
  useEffect(() => {
    resetTheme();
  }, []); // optionally re-run on theme changes if needed

  return <Head />;
}
