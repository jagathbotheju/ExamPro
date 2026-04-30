'use client';

import { Calculator, FlaskConical, Landmark, BookOpen, CircleDot, Music, BookMarked } from 'lucide-react';
import type { Subject } from '@/app/_lib/types';

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  calculator: Calculator,
  'flask-conical': FlaskConical,
  landmark: Landmark,
  'book-open': BookOpen,
  'circle-dot': CircleDot,
  music: Music,
};

const SLUG_META: Record<string, { color: string; icon: string }> = {
  math:     { color: '#7c5cff', icon: 'calculator' },
  science:  { color: '#22d3ee', icon: 'flask-conical' },
  history:  { color: '#fbbf24', icon: 'landmark' },
  english:  { color: '#f472b6', icon: 'book-open' },
  buddhism: { color: '#2dd4bf', icon: 'circle-dot' },
  music:    { color: '#fb7185', icon: 'music' },
};

interface SubjectBlockProps {
  subject?: Subject | null;
  slug?: string;
  size?: number;
}

export function SubjectBlock({ subject, slug, size = 40 }: SubjectBlockProps) {
  const meta = subject
    ? { color: subject.color, icon: subject.icon }
    : (slug ? SLUG_META[slug] : null) ?? { color: '#7c5cff', icon: 'calculator' };

  const Icon = ICONS[meta.icon] ?? BookMarked;
  const iconSize = Math.round(size * 0.42);

  return (
    <div
      className="subj-chip"
      style={{
        width: size, height: size, borderRadius: Math.round(size * 0.25),
        background: meta.color + '22',
      }}
    >
      <Icon size={iconSize} color={meta.color} />
    </div>
  );
}
