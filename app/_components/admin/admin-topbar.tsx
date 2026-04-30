'use client';

import { Bell, Moon, Search } from 'lucide-react';
import { getInitials } from '@/app/_lib/utils';

interface AdminTopbarProps { adminName?: string }

export function AdminTopbar({ adminName }: AdminTopbarProps) {
  const initials = adminName ? getInitials(adminName) : 'A';
  return (
    <header className="topbar">
      <div className="topbar-greeting">
        <strong>{adminName ?? 'Admin'}</strong>
        {' · '}<span style={{ color: 'var(--accent)' }}>Admin</span>
      </div>
      <div className="topbar-right">
        <button className="icon-btn"><Search size={16} /></button>
        <button className="icon-btn"><Bell size={16} /></button>
        <button className="icon-btn"><Moon size={16} /></button>
        <div className="avatar">{initials}</div>
      </div>
    </header>
  );
}
