'use client';

import { useEffect, useState } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('exampro-theme');
    const dark = stored !== 'light';
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  const setDark = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);
    localStorage.setItem('exampro-theme', dark ? 'dark' : 'light');
  };

  return { isDark, setDark };
}
