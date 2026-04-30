'use client';

import { Eye, Play } from 'lucide-react';
import { SubjectBlock } from './subject-block';
import { getGrade, formatDate } from '@/app/_lib/utils';
import type { Exam, ExamSubmission } from '@/app/_lib/types';

interface PendingExamRowProps {
  exam: Exam;
  onStart: (exam: Exam) => void;
}

export function PendingExamRow({ exam, onStart }: PendingExamRowProps) {
  return (
    <div className="list-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SubjectBlock subject={exam.subject} />
        <div>
          <div className="list-name">{exam.name}</div>
          <div className="list-meta">
            {exam.subject && <span style={{ color: exam.subject.color }}>{exam.subject.name}</span>}
            {exam.subject && <span style={{ color: 'var(--text-dim)' }}>·</span>}
            <span>{formatDate(exam.publishedAt)}</span>
            {exam.questionCount != null && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span>{exam.questionCount} Qs</span>
              </>
            )}
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>{exam.durationMinutes} min</span>
          </div>
        </div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => onStart(exam)}>
        <Play size={12} /> Start Exam
      </button>
    </div>
  );
}

interface CompletedExamRowProps {
  submission: ExamSubmission;
  onView: (submission: ExamSubmission) => void;
}

export function CompletedExamRow({ submission, onView }: CompletedExamRowProps) {
  const { color } = getGrade(submission.score);
  const { grade } = getGrade(submission.score);
  return (
    <div className="list-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <SubjectBlock subject={submission.exam?.subject} />
        <div>
          <div className="list-name">{submission.exam?.name ?? 'Exam'}</div>
          <div className="list-meta">
            {submission.exam?.subject && (
              <span style={{ color: submission.exam.subject.color }}>{submission.exam.subject.name}</span>
            )}
            {submission.exam?.subject && <span style={{ color: 'var(--text-dim)' }}>·</span>}
            <span>{formatDate(submission.submittedAt)}</span>
            <span style={{ color: 'var(--text-dim)' }}>·</span>
            <span>{submission.correctCount}/{submission.totalQuestions} correct</span>
          </div>
        </div>
      </div>
      <div className="list-actions">
        <span className="pill" style={{ background: color + '22', color }}>{submission.score}% · {grade}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => onView(submission)}>
          <Eye size={12} /> View
        </button>
      </div>
    </div>
  );
}
