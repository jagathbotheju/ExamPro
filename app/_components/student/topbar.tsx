'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/app/_lib/utils';
import type { StudentProfile } from '@/app/_lib/types';

interface TopbarProps { profile: StudentProfile | null }

export function StudentTopbar({ profile }: TopbarProps) {
  const router = useRouter();
  const firstName = profile?.name?.split(' ')[0] ?? 'Student';
  const initials = profile ? getInitials(profile.name) : '?';
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
        <strong>{firstName}</strong>
        {profile?.grade ? ` · ${profile.grade}` : ''}
      </div>
      <div className="topbar-right">
        {/* <button className="icon-btn"><Search size={16} /></button> */}
        {/* <button className="icon-btn" style={{ position: 'relative' }}>
          <Bell size={16} />
          <span className="notif-dot" />
        </button> */}
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isLight ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="avatar" onClick={() => router.push('/dashboard/profile')} title="Profile">
          {initials}
        </button>
      </div>
    </header>
  );
}
