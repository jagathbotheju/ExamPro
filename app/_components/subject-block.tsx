'use client';

import { SUBJECTS } from '@/app/_lib/data';
import Icon from './fa-icon';

interface SubjectBlockProps {
  subjectId: string;
  size?: number;
}

export function SubjectBlock({ subjectId, size = 40 }: SubjectBlockProps) {
  const subj = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0];
  return (
    <div
      className="subj-icon"
      style={{ width: size, height: size, background: `${subj.color}22`, color: subj.color }}
    >
      <Icon name={subj.icon} style={{ fontSize: size * 0.42 }} />
    </div>
  );
}

export function SubjectName({ id }: { id: string }) {
  const subj = SUBJECTS.find(s => s.id === id);
  return subj ? <span style={{ color: subj.color }}>{subj.name}</span> : null;
}
