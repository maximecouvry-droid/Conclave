'use client';
import { useEffect, useState } from 'react';

type Theme = 'auto' | 'light' | 'dark';
const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
const LABEL: Record<Theme, string> = { auto: 'Auto', light: 'Clair', dark: 'Sombre' };

/** Clair / sombre / auto, comme la V1 (auto = préférence du téléphone). */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');
  useEffect(() => {
    try {
      const t = localStorage.getItem('mdm-theme');
      if (t === 'light' || t === 'dark') setTheme(t);
    } catch {}
  }, []);
  const cycle = () => {
    const n = NEXT[theme];
    setTheme(n);
    try {
      if (n === 'auto') {
        localStorage.removeItem('mdm-theme');
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem('mdm-theme', n);
        document.documentElement.dataset.theme = n;
      }
    } catch {}
  };
  return (
    <button className="ghost" onClick={cycle} aria-label="Changer de thème">
      {LABEL[theme]}
    </button>
  );
}
