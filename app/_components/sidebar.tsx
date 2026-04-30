'use client';

import { StudentProfile } from '@/app/_lib/data';
import Icon from './fa-icon';

type Tab = 'home' | 'exams' | 'profile';

interface SidebarProps {
  active: Tab;
  onNav: (tab: Tab) => void;
  profile: StudentProfile;
}

const NAV_ITEMS = [
  { id: 'home' as Tab, label: 'Home', icon: 'fa-house' },
  { id: 'exams' as Tab, label: 'Exams', icon: 'fa-file-pen' },
  { id: 'profile' as Tab, label: 'Profile', icon: 'fa-user' },
];

export default function Sidebar({ active, onNav, profile }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">ExamPro</div>
        <div className="brand-tag">Expert Level</div>
      </div>
      <nav className="nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNav(item.id)}
          >
            <Icon name={item.icon} style={{ width: 16 }} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="streak">
          <Icon name="fa-fire" style={{ color: 'var(--amber)' }} />
          <span>Study streak</span>
        </div>
        <div className="streak-num">{profile.streak} days</div>
        <div className="streak-foot">Keep going — your record is 21 days</div>
      </div>
    </aside>
  );
}
