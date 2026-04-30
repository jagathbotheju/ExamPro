'use client';

import { ExamResult } from '@/app/_lib/data';
import Icon from './fa-icon';

interface ExamResultsProps {
  result: ExamResult;
  onClose: () => void;
}

function ScoreRing({ value }: { value: number }) {
  const r = 36, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1c2845" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke="url(#ringGradResult)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <defs>
          <linearGradient id="ringGradResult" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ring-num">{value}%</div>
    </div>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 70 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
      <div className="label-tiny" style={{ marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function ExamResults({ result, onClose }: ExamResultsProps) {
  const { exam, questions, answers, score, correctCount, total, timeSpent } = result;
  const mm = String(Math.floor(timeSpent / 60)).padStart(2, '0');
  const ss = String(timeSpent % 60).padStart(2, '0');

  return (
    <div className="exam-shell" style={{ overflowY: 'auto', display: 'block' }}>
      <div className="exam-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="fa-arrow-left" />
          </button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Exam Results</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exam.name}</div>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onClose}>
          <Icon name="fa-house" />
          Back to Dashboard
        </button>
      </div>

      <div style={{ padding: '32px 60px', maxWidth: 980, margin: '0 auto' }}>
        {/* Summary card */}
        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 32, alignItems: 'center' }}>
            <ScoreRing value={score} />
            <div>
              <div className="label-tiny" style={{ marginBottom: 6 }}>Final Score</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {score >= 80 ? '🎉 Great job!' : score >= 60 ? 'Solid effort' : 'Keep practicing'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                You answered {correctCount} of {total} questions correctly.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <SummaryStat label="Correct" value={correctCount} color="var(--green)" />
              <SummaryStat label="Wrong" value={total - correctCount} color="var(--red)" />
              <SummaryStat label="Time" value={`${mm}:${ss}`} color="var(--cyan)" />
            </div>
          </div>
        </div>

        <div className="label-tiny" style={{ marginBottom: 14 }}>Question Review</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const correct = userAns === q.correct;
            return (
              <div key={q.id} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Question {i + 1}</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{q.body}</div>
                  </div>
                  <span className={`pill ${correct ? 'pill-green' : 'pill-red'}`}>
                    <Icon name={correct ? 'fa-check' : 'fa-xmark'} />
                    {correct ? 'Correct' : userAns == null ? 'Skipped' : 'Wrong'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((o, j) => {
                    let cls = '';
                    if (j === q.correct) cls = 'correct';
                    else if (j === userAns) cls = 'wrong';
                    return (
                      <div key={j} className={`opt ${cls}`} style={{ cursor: 'default' }}>
                        <div className="opt-letter">{String.fromCharCode(65 + j)}</div>
                        <div style={{ flex: 1 }}>{o}</div>
                        {j === q.correct && (
                          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>CORRECT ANSWER</span>
                        )}
                        {j === userAns && j !== q.correct && (
                          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>YOUR ANSWER</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
