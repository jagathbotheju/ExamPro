'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, ArrowLeft, Printer } from 'lucide-react';
import { ScoreRing } from '@/app/_components/shared/score-ring';
import { getGrade, formatTime } from '@/app/_lib/utils';
import type { ExamResult } from '@/app/_lib/types';

interface ExamResultsProps { result: ExamResult; backHref?: string }

export function ExamResults({ result, backHref = '/dashboard' }: ExamResultsProps) {
  const { submission, exam, questions } = result;
  const { grade, label, color } = getGrade(submission.score);
  const wrong = submission.totalQuestions - submission.correctCount;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', overflow: 'auto',
    }}>
      <style>{`
        @media print {
          body { background: #fff !important; color: #111 !important; font-family: Inter, sans-serif; }
          .no-print { display: none !important; }
          .print-root { min-height: unset !important; background: #fff !important; }
          .print-content { padding: 24px !important; max-width: 100% !important; }
          .print-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; border-bottom: 2px solid #ddd; padding-bottom: 12px; }
          .print-header h1 { font-size: 20px; font-weight: 700; margin: 0; color: #111; }
          .print-header span { font-size: 13px; color: #666; }
          .card, .card-hero {
            background: #f9f9f9 !important;
            border: 1px solid #ddd !important;
            border-radius: 10px !important;
            break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .opt { border: 1px solid #ddd !important; background: #fff !important; }
          .opt.correct { background: #e6faf6 !important; border-color: #2dd4bf !important; }
          .opt.wrong { background: #fdecea !important; border-color: #e63946 !important; }
          .opt-letter { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pill-green { background: rgba(45,212,191,0.15) !important; color: #0d9488 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pill-red { background: rgba(230,57,70,0.15) !important; color: #c0151f !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Top bar */}
      <div className="no-print" style={{
        padding: '16px 28px', background: 'var(--panel)',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{exam.name} — Results</div>
        <Link href={backHref} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      <div className="print-content" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        {/* Print-only header */}
        <div className="print-header" style={{ display: 'none' }}>
          <h1>{exam.name}</h1>
          <span>Exam Results</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>
            Printed on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Summary */}
        <div className="card card-hero" style={{ marginBottom: 24, position: 'relative' }}>
          <button
            className="no-print"
            onClick={() => window.print()}
            style={{
              position: 'absolute', top: 14, left: 16,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--panel-2)', color: 'var(--text-muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
            }}
          >
            <Printer size={13} /> Print / Save PDF
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 8 }}>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: q.imageUrl ? 12 : 14, lineHeight: 1.5 }}>
                  {q.body}
                </div>
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt="Question image"
                    style={{
                      maxWidth: '100%', maxHeight: 280, borderRadius: 10,
                      marginBottom: 14, objectFit: 'contain',
                      background: 'var(--panel-2)',
                    }}
                  />
                )}
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

        <div className="no-print" style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <Link href={backHref} className="btn btn-primary btn-lg">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
