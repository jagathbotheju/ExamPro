'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, FileText, User, Flame, LogOut } from 'lucide-react';
import type { StudentProfile } from '@/app/_lib/types';
import { Button } from '../ui/button';
import { useClerk } from '@clerk/nextjs';

const NAV = [
  { href: '/dashboard', label: 'Home', Icon: House },
  { href: '/dashboard/exams', label: 'Exams', Icon: FileText },
  { href: '/dashboard/profile', label: 'Profile', Icon: User },
];

interface SidebarProps { profile: StudentProfile | null }

function useClerkSignOut() {
  const clerk = useClerk();
  return () => clerk.signOut({ redirectUrl: '/sign-in' });
}

export function StudentSidebar({ profile }: SidebarProps) {
  const signOut = useClerkSignOut();
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

      <Button
        onClick={signOut}
        className="bg-red-500/70!  hover:bg-red-500! shrink-0 mt-auto"
      >
        <LogOut size={14} />
        Logout
      </Button>

      {/* <div className="sidebar-foot">
        <div className="streak">
          <Flame size={16} color="var(--amber)" />
          <span>Study streak</span>
        </div>
        <div className="streak-num">{profile?.studyStreak ?? 0}</div>
        <div className="streak-foot">Best: {profile?.bestStreak ?? 0} days</div>
      </div> */}
    </aside>
  );
}
