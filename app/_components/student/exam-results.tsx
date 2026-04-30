'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { ScoreRing } from '@/app/_components/shared/score-ring';
import { getGrade, formatTime } from '@/app/_lib/utils';
import type { ExamResult } from '@/app/_lib/types';

interface ExamResultsProps { result: ExamResult }

export function ExamResults({ result }: ExamResultsProps) {
  const { submission, exam, questions } = result;
  const { grade, label, color } = getGrade(submission.score);
  const wrong = submission.totalQuestions - submission.correctCount;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      {/* Top bar */}
      <div style={{
        padding: '16px 28px', background: 'var(--panel)',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{exam.name} — Results</div>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        {/* Summary */}
        <div className="card card-hero" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ScoreRing score={submission.score} size={130} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6 }}>
                {submission.score}%
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color, marginBottom: 16 }}>
                Grade {grade} — {label}
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--green)', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> {submission.correctCount} Correct
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--red)', fontWeight: 600 }}>
                    <XCircle size={14} /> {wrong} Incorrect
                  </div>
                </div>
                {submission.timeSpentSeconds != null && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Clock size={14} /> {formatTime(submission.timeSpentSeconds)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q, i) => {
            const selected = submission.answers[q.id];
            const isCorrect = selected === q.correctIndex;
            return (
              <div key={q.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="label-tiny">Question {i + 1}</span>
                  <span className={`pill ${isCorrect ? 'pill-green' : 'pill-red'}`}>
                    {isCorrect ? 'CORRECT' : 'INCORRECT'}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14, lineHeight: 1.5 }}>
                  {q.body}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt, oi) => {
                    const isCorrectOpt = oi === q.correctIndex;
                    const isUserOpt = oi === selected;
                    let cls = '';
                    if (isCorrectOpt) cls = 'correct';
                    else if (isUserOpt && !isCorrect) cls = 'wrong';
                    return (
                      <div key={oi} className={`opt ${cls}`} style={{ cursor: 'default' }}>
                        <span className="opt-letter">{String.fromCharCode(65 + oi)}</span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {isCorrectOpt && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginLeft: 8 }}>CORRECT ANSWER</span>}
                        {isUserOpt && !isCorrect && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginLeft: 8 }}>YOUR ANSWER</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
