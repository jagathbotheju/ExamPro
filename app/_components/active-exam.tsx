'use client';

import { useState, useEffect } from 'react';
import { Exam, ExamResult, ACTIVE_EXAM_QUESTIONS } from '@/app/_lib/data';
import Icon from './fa-icon';
import { SubjectBlock, SubjectName } from './subject-block';

interface ActiveExamProps {
  exam: Exam;
  onSubmit: (result: ExamResult) => void;
  onCancel: () => void;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {label}
    </div>
  );
}

export default function ActiveExam({ exam, onSubmit, onCancel }: ActiveExamProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState((exam?.duration || 30) * 60);
  const [submitting, setSubmitting] = useState(false);

  const questions = ACTIVE_EXAM_QUESTIONS;

  useEffect(() => {
    if (submitting) return;
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [submitting]);

  useEffect(() => {
    if (seconds === 0) handleSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const select = (i: number) => setAnswers(a => ({ ...a, [q.id]: i }));
  const toggleFlag = () => setFlagged(s => {
    const n = new Set(s);
    if (n.has(q.id)) n.delete(q.id); else n.add(q.id);
    return n;
  });

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const correctCount = questions.filter(qq => answers[qq.id] === qq.correct).length;
      const elapsed = (exam?.duration || 30) * 60 - seconds;
      onSubmit({
        exam,
        questions,
        answers,
        score: Math.round((correctCount / questions.length) * 100),
        correctCount,
        total: questions.length,
        timeSpent: elapsed,
      });
    }, 2200);
  };

  if (submitting) {
    return (
      <div className="exam-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 24px' }} />
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Grading your exam…</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Calculating your score and feedback</div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-shell">
      {/* Top bar */}
      <div className="exam-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="icon-btn" onClick={onCancel}>
            <Icon name="fa-arrow-left" />
          </button>
          <SubjectBlock subjectId={exam.subject} size={36} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{exam.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {exam.questions} Questions · <SubjectName id={exam.subject} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', background: 'var(--panel-2)',
            border: '1px solid var(--border-soft)', borderRadius: 10,
          }}>
            <Icon name="fa-clock" style={{ color: seconds < 60 ? 'var(--red)' : 'var(--accent)' }} />
            <span style={{
              fontSize: 14, fontWeight: 700, fontFeatureSettings: '"tnum"',
              color: seconds < 60 ? 'var(--red)' : 'var(--text)',
            }}>
              {mm}:{ss}
            </span>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <Icon name="fa-paper-plane" />
            Submit Exam
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="exam-body">
        <div className="exam-q-area">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div className="label-tiny">Question {current + 1} of {questions.length}</div>
              <button
                className={`btn btn-sm ${flagged.has(q.id) ? 'btn-soft' : 'btn-ghost'}`}
                onClick={toggleFlag}
              >
                <Icon name="fa-flag" />
                {flagged.has(q.id) ? 'Flagged' : 'Flag for Review'}
              </button>
            </div>

            <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.4, marginBottom: 28, letterSpacing: '-0.005em' }}>
              {q.body}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map((o, i) => (
                <button
                  key={i}
                  className={`opt ${answers[q.id] === i ? 'selected' : ''}`}
                  onClick={() => select(i)}
                >
                  <div className="opt-letter">{String.fromCharCode(65 + i)}</div>
                  <div>{o}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36 }}>
              <button
                className="btn btn-ghost"
                disabled={current === 0}
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
              >
                <Icon name="fa-arrow-left" />
                Previous
              </button>
              {current < questions.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                >
                  Next
                  <Icon name="fa-arrow-right" />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSubmit}>
                  Finish
                  <Icon name="fa-check" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="exam-side">
          <div className="label-tiny" style={{ marginBottom: 12 }}>Progress</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            {answeredCount}/{questions.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>answered</div>
          <div className="progress" style={{ marginBottom: 22 }}>
            <div style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>

          <div className="label-tiny" style={{ marginBottom: 12 }}>Question Navigator</div>
          <div className="q-grid">
            {questions.map((qq, i) => {
              const cls = i === current ? 'current'
                : flagged.has(qq.id) ? 'flagged'
                : answers[qq.id] != null ? 'answered'
                : '';
              return (
                <button key={qq.id} className={`q-num ${cls}`} onClick={() => setCurrent(i)}>
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <Legend color="var(--accent)" label="Current" />
            <Legend color="var(--green)" label="Answered" />
            <Legend color="var(--amber)" label="Flagged" />
            <Legend color="var(--text-dim)" label="Not visited" />
          </div>
        </div>
      </div>
    </div>
  );
}
