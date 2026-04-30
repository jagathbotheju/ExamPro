import { create } from 'zustand';

interface AdminStore {
  selectedStudentId: string | null;
  examFilters: { grade: string; subject: string };
  questionFilters: { grade: string; subject: string; search: string };
  setSelectedStudent: (id: string | null) => void;
  setExamFilters: (f: Partial<AdminStore['examFilters']>) => void;
  setQuestionFilters: (f: Partial<AdminStore['questionFilters']>) => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  selectedStudentId: null,
  examFilters: { grade: '', subject: '' },
  questionFilters: { grade: '', subject: '', search: '' },
  setSelectedStudent: (id) => set({ selectedStudentId: id }),
  setExamFilters: (f) => set(s => ({ examFilters: { ...s.examFilters, ...f } })),
  setQuestionFilters: (f) => set(s => ({ questionFilters: { ...s.questionFilters, ...f } })),
}));
