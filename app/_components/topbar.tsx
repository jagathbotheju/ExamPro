'use client';

import { StudentProfile } from '@/app/_lib/data';
import Icon from './fa-icon';

interface TopbarProps {
  profile: StudentProfile;
  onProfileClick: () => void;
}

export default function Topbar({ profile, onProfileClick }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-greeting">
        <strong>{profile.shortName}</strong> · {profile.grade}
      </div>
      <div className="topbar-actions">
        {/* <button className="icon-btn">
          <Icon name="fa-magnifying-glass" />
        </button> */}
        <button className="icon-btn">
          <Icon name="fa-bell" />
          <span className="dot" />
        </button>
        <button className="icon-btn">
          <Icon name="fa-moon" />
        </button>
        <button className="avatar" onClick={onProfileClick}>
          {profile.initials}
        </button>
      </div>
    </header>
  );
}
