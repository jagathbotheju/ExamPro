'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Database, Settings, ShieldCheck } from 'lucide-react';

const NAV = [
  { href: '/admin',           label: 'Home',           Icon: LayoutDashboard },
  { href: '/admin/exams',     label: 'Exams',          Icon: FileText        },
  { href: '/admin/questions', label: 'Questions Bank', Icon: Database        },
  { href: '/admin/settings',  label: 'Settings',       Icon: Settings        },
];

interface AdminSidebarProps { adminName?: string }

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">ExamPro</div>
        <div className="brand-tag">Admin Console</div>
      </div>
      <nav className="nav">
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${path === href || (href !== '/admin' && path.startsWith(href)) ? 'active' : ''}`}
          >
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ShieldCheck size={16} color="var(--accent)" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Administrator</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{adminName ?? 'Admin'}</div>
      </div>
    </aside>
  );
}
