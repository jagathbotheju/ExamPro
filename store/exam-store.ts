import { create } from 'zustand';
import type { Question } from '@/app/_lib/types';

type Phase = 'idle' | 'active' | 'grading' | 'done';

interface ExamStore {
  examId: string | null;
  questions: Question[];
  answers: Record<string, number>;
  flagged: Set<string>;
  currentIndex: number;
  timeRemaining: number;
  phase: Phase;

  initExam: (examId: string, questions: Question[], durationSeconds: number) => void;
  setAnswer: (questionId: string, optionIndex: number) => void;
  toggleFlag: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  tick: () => void;
  startGrading: () => void;
  reset: () => void;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  examId: null,
  questions: [],
  answers: {},
  flagged: new Set(),
  currentIndex: 0,
  timeRemaining: 0,
  phase: 'idle',

  initExam: (examId, questions, durationSeconds) =>
    set({ examId, questions, answers: {}, flagged: new Set(), currentIndex: 0, timeRemaining: durationSeconds, phase: 'active' }),

  setAnswer: (questionId, optionIndex) =>
    set(s => ({ answers: { ...s.answers, [questionId]: optionIndex } })),

  toggleFlag: (questionId) =>
    set(s => {
      const next = new Set(s.flagged);
      if (next.has(questionId)) next.delete(questionId); else next.add(questionId);
      return { flagged: next };
    }),

  goTo: (index) => set({ currentIndex: index }),
  next: () => set(s => ({ currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1) })),
  prev: () => set(s => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),

  tick: () =>
    set(s => {
      if (s.phase !== 'active') return s;
      const next = s.timeRemaining - 1;
      if (next <= 0) return { timeRemaining: 0, phase: 'grading' };
      return { timeRemaining: next };
    }),

  startGrading: () => set({ phase: 'grading' }),
  reset: () => set({ examId: null, questions: [], answers: {}, flagged: new Set(), currentIndex: 0, timeRemaining: 0, phase: 'idle' }),
}));
