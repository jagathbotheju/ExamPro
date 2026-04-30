import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 75) return { grade: 'A',   label: 'Distinction',    color: 'var(--green)'  };
  if (score >= 65) return { grade: 'B',   label: 'Very Good Pass', color: 'var(--cyan)'   };
  if (score >= 50) return { grade: 'C',   label: 'Credit Pass',    color: 'var(--accent)' };
  if (score >= 35) return { grade: 'S',   label: 'Ordinary Pass',  color: 'var(--amber)'  };
  return             { grade: 'F/W', label: 'Failure',         color: 'var(--red)'    };
}

export function getScoreColor(score: number): string {
  return getGrade(score).color;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const SUBJECT_MAP: Record<string, { color: string; icon: string }> = {
  math:     { color: '#7c5cff', icon: 'calculator' },
  science:  { color: '#22d3ee', icon: 'flask-conical' },
  history:  { color: '#fbbf24', icon: 'landmark' },
  english:  { color: '#f472b6', icon: 'book-open' },
  buddhism: { color: '#2dd4bf', icon: 'circle-dot' },
  music:    { color: '#fb7185', icon: 'music' },
};

export function getSubjectColor(slug: string): string {
  return SUBJECT_MAP[slug]?.color ?? '#7c5cff';
}

export function getSubjectIcon(slug: string): string {
  return SUBJECT_MAP[slug]?.icon ?? 'book';
}
