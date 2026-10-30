import { GraduationCap, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Brand({ small = false }) {
  return (
    <div className={`brand ${small ? 'small' : ''}`}>
      <span className="brand-mark"><GraduationCap size={small ? 18 : 22} strokeWidth={2.2} /></span>
      <span className="brand-name">Edu<span>Nova</span></span>
    </div>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0d17' : '#f5f6fb');
  }, [theme]);

  return (
    <button
      className="icon-btn"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
