'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, FileText, User, Flame } from 'lucide-react';
import type { StudentProfile } from '@/app/_lib/types';

const NAV = [
  { href: '/dashboard',         label: 'Home',    Icon: House     },
  { href: '/dashboard/exams',   label: 'Exams',   Icon: FileText  },
  { href: '/dashboard/profile', label: 'Profile', Icon: User      },
];

interface SidebarProps { profile: StudentProfile | null }

export function StudentSidebar({ profile }: SidebarProps) {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">ExamPro</div>
        <div className="brand-tag">Expert Level</div>
      </div>

      <nav className="nav">
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${path === href || (href !== '/dashboard' && path.startsWith(href)) ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="streak">
          <Flame size={16} color="var(--amber)" />
          <span>Study streak</span>
        </div>
        <div className="streak-num">{profile?.studyStreak ?? 0}</div>
        <div className="streak-foot">Best: {profile?.bestStreak ?? 0} days</div>
      </div>
    </aside>
  );
}
