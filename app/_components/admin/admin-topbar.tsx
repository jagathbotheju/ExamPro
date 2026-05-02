'use client';

import { useState, useEffect } from 'react';
import { Bell, Moon, Search, Sun } from 'lucide-react';
import { getInitials } from '@/app/_lib/utils';

interface AdminTopbarProps { adminName?: string }

export function AdminTopbar({ adminName }: AdminTopbarProps) {
  const initials = adminName ? getInitials(adminName) : 'A';
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      document.documentElement.classList.add('light');
      setIsLight(true);
    }
  }, []);

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-greeting">
        <strong>{adminName ?? 'Admin'}</strong>
        {' · '}<span style={{ color: 'var(--accent)' }}>Admin</span>
      </div>
      <div className="topbar-right">
        {/* <button className="icon-btn"><Search size={16} /></button> */}
        {/* <button className="icon-btn"><Bell size={16} /></button> */}
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isLight ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="avatar">{initials}</div>
      </div>
    </header>
  );
}
