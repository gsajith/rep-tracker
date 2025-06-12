'use client';
import { useTheme } from '@/context/themeProvider';

export default function Settings() {
  const { setThemeName } = useTheme();

  return (
    <div>
      settings page!
      <button onClick={() => setThemeName('default')}>Default</button>
      <button onClick={() => setThemeName('blue')}>Blue</button>
      <button onClick={() => setThemeName('purple')}>Purple</button>
    </div>
  );
}
