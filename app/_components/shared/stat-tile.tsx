'use client';

import { LucideIcon } from 'lucide-react';

interface StatTileProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: string;
}

export function StatTile({ icon: Icon, iconColor, label, value, trend }: StatTileProps) {
  return (
    <div className="stat-tile">
      <div className="stat-icon-chip" style={{ background: iconColor + '22' }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div className="stat-num">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}
