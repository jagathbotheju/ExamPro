'use client';

import { Exam, SUBJECTS } from '@/app/_lib/data';
import Icon from './fa-icon';
import { SubjectBlock } from './subject-block';

interface PendingExamRowProps {
  exam: Exam;
  onStart: (exam: Exam) => void;
}

export function PendingExamRow({ exam, onStart }: PendingExamRowProps) {
  const subj = SUBJECTS.find(s => s.id === exam.subject)!;
  return (
    <div className="list-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SubjectBlock subjectId={exam.subject} />
        <div>
          <div className="list-name">{exam.name}</div>
          <div className="list-meta">
            <span style={{ color: subj.color }}>{subj.name}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>Published {exam.published}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>{exam.questions} Qs · {exam.duration} min</span>
          </div>
        </div>
      </div>
      <div className="list-actions">
        <button className="btn btn-soft btn-sm" onClick={() => onStart(exam)}>
          <Icon name="fa-play" />
          Start Exam
        </button>
      </div>
    </div>
  );
}

interface CompletedExamRowProps {
  exam: Exam;
  onView: (exam: Exam) => void;
}

export function CompletedExamRow({ exam, onView }: CompletedExamRowProps) {
  const subj = SUBJECTS.find(s => s.id === exam.subject)!;
  const score = exam.score ?? 0;
  const scoreColor = score >= 90 ? 'var(--green)' : score >= 75 ? 'var(--cyan)' : 'var(--amber)';
  return (
    <div className="list-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SubjectBlock subjectId={exam.subject} />
        <div>
          <div className="list-name">{exam.name}</div>
          <div className="list-meta">
            <span style={{ color: subj.color }}>{subj.name}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>Completed {exam.completed}</span>
          </div>
        </div>
      </div>
      <div className="list-actions">
        <div style={{ textAlign: 'right', marginRight: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: scoreColor, fontFeatureSettings: '"tnum"' }}>{score}%</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => onView(exam)}>
          <Icon name="fa-eye" />
          View
        </button>
      </div>
    </div>
  );
}
