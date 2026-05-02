'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, ChevronLeft, ChevronRight, Send, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useExamStore } from '@/store/exam-store';
import { formatTime } from '@/app/_lib/utils';
import { submitExam } from '@/actions/student/submitExam';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/app/_components/ui/dialog';
import type { Exam, Question } from '@/app/_lib/types';

interface ActiveExamProps {
  exam: Exam;
  questions: Question[];
}

export function ActiveExam({ exam, questions }: ActiveExamProps) {
  const router = useRouter();
  const store = useExamStore();
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const startTimeRef = useRef(Date.now());
  const submittingRef = useRef(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    store.initExam(exam.id, questions, exam.durationMinutes * 60);
    timerRef.current = setInterval(() => store.tick(), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam.id]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    store.startGrading();
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const { answers, timeRemaining } = useExamStore.getState();
    try {
      await submitExam({ examId: exam.id, answers, timeSpentSeconds: timeSpent });
      router.replace(`/exam/${exam.id}/result`);
    } catch {
      toast.error('Failed to submit. Please try again.');
      submittingRef.current = false;
      store.initExam(exam.id, questions, timeRemaining);
    }
  }, [exam.id, store, router, questions]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (store.phase === 'grading' && store.timeRemaining <= 0) {
      handleSubmit();
    }
  }, [store.phase, store.timeRemaining, handleSubmit]);

  if (store.phase === 'grading') {
    return (
      <div className="exam-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <div className="spinner" />
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Grading your exam…</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Please wait</div>
      </div>
    );
  }

  const q = questions[store.currentIndex];
  if (!q) return null;

  const answered = Object.keys(store.answers).length;
  const progress = (answered / questions.length) * 100;

  return (
    <div className="exam-shell">
      {/* Top bar */}
      <div className="exam-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{exam.name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={`timer ${store.timeRemaining < 60 ? 'urgent' : ''}`}>
            {formatTime(store.timeRemaining)}
          </div>
          {/* <button className="btn btn-red" onClick={() => { if (confirm('Submit exam?')) handleSubmit(); }}>
            <Send size={14} /> Submit
          </button> */}
          <button className="btn btn-red" onClick={() => setShowCancelDialog(true)}>
            <X size={14} /> Cancel
          </button>

        </div>
      </div>

      {/* Body */}
      <div className="exam-body">
        {/* Question area */}
        <div className="exam-questions">
          <div style={{ marginBottom: 20 }}>
            <span className="label-tiny">Question {store.currentIndex + 1} of {questions.length}</span>
            {store.flagged.has(q.id) && <span className="pill pill-amber" style={{ marginLeft: 10 }}>FLAGGED</span>}
          </div>
          <div
            className="rich-text-display"
            style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', lineHeight: 1.6, marginBottom: 28 }}
            dangerouslySetInnerHTML={{ __html: q.body }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`opt ${store.answers[q.id] === i ? 'selected' : ''}`}
                onClick={() => store.setAnswer(q.id, i)}
              >
                <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28 }}>
            <button className="btn btn-ghost" disabled={store.currentIndex === 0} onClick={store.prev}>
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              className={`btn ${store.flagged.has(q.id) ? 'btn-soft' : 'btn-ghost'}`}
              onClick={() => store.toggleFlag(q.id)}
            >
              <Flag size={14} />
              {store.flagged.has(q.id) ? 'Unflag' : 'Flag for review'}
            </button>
            {store.currentIndex < questions.length - 1 ? (
              <button className="btn btn-ghost" onClick={store.next}>
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowSubmitDialog(true)}>
                <Send size={14} /> Finish & Submit
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="exam-sidebar">
          <div style={{ marginBottom: 14 }}>
            <div className="label-tiny" style={{ marginBottom: 8 }}>Progress</div>
            <div className="progress"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {answered} / {questions.length} answered
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div className="label-tiny" style={{ marginBottom: 10 }}>Questions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {questions.map((question, i) => {
                let cls = '';
                if (i === store.currentIndex) cls = 'current';
                else if (store.flagged.has(question.id)) cls = 'flagged';
                else if (store.answers[question.id] != null) cls = 'answered';
                return (
                  <button key={i} className={`q-num ${cls}`} onClick={() => store.goTo(i)}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              <div className="q-num current" style={{ width: 14, height: 14, fontSize: 9, borderRadius: 3 }}></div> Current
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              <div className="q-num answered" style={{ width: 14, height: 14, fontSize: 9, borderRadius: 3 }}></div> Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              <div className="q-num flagged" style={{ width: 14, height: 14, fontSize: 9, borderRadius: 3 }}></div> Flagged
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <AlertTriangle size={20} color="var(--red)" />
              <DialogTitle style={{ color: 'var(--text)', fontSize: 16 }}>Cancel exam?</DialogTitle>
            </div>
            <DialogDescription>
              All your progress and answers will be lost. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => setShowCancelDialog(false)}>Keep going</button>
            <button
              className="btn btn-red"
              onClick={() => {
                setShowCancelDialog(false);
                if (timerRef.current) clearInterval(timerRef.current);
                store.reset();
                router.push('/dashboard');
              }}
            >
              <X size={14} /> Yes, cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28 }}>
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Send size={18} color="var(--accent)" />
              <DialogTitle style={{ color: 'var(--text)', fontSize: 16 }}>Submit exam?</DialogTitle>
            </div>
            <DialogDescription>
              {answered < questions.length
                ? `You have ${questions.length - answered} unanswered question${questions.length - answered > 1 ? 's' : ''}. You won't be able to change your answers after submitting.`
                : 'You have answered all questions. Ready to submit?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={() => setShowSubmitDialog(false)}>Review answers</button>
            <button
              className="btn btn-primary"
              onClick={() => { setShowSubmitDialog(false); handleSubmit(); }}
            >
              <Send size={14} /> Submit now
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
