'use client';

import { Search, Bell, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/app/_lib/utils';
import type { StudentProfile } from '@/app/_lib/types';

interface TopbarProps { profile: StudentProfile | null }

export function StudentTopbar({ profile }: TopbarProps) {
  const router = useRouter();
  const firstName = profile?.name?.split(' ')[0] ?? 'Student';
  const initials = profile ? getInitials(profile.name) : '?';

  return (
    <header className="topbar">
      <div className="topbar-greeting">
        <strong>{firstName}</strong>
        {profile?.grade ? ` · ${profile.grade}` : ''}
      </div>
      <div className="topbar-right">
        <button className="icon-btn"><Search size={16} /></button>
        <button className="icon-btn" style={{ position: 'relative' }}>
          <Bell size={16} />
          <span className="notif-dot" />
        </button>
        <button className="icon-btn"><Moon size={16} /></button>
        <button className="avatar" onClick={() => router.push('/dashboard/profile')} title="Profile">
          {initials}
        </button>
      </div>
    </header>
  );
}
