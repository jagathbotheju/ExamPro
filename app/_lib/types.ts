export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type ExamStatus = 'draft' | 'published' | 'archived';
export type AssignmentStatus = 'pending' | 'completed';
export type Sex = 'Male' | 'Female' | 'Other';

export const GRADE_LABELS = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12', 'Grade 13',
] as const;
export type GradeLabel = (typeof GRADE_LABELS)[number];

export interface Subject {
  id: string;
  slug: string;
  name: string;
  color: string;
  icon: string;
}

export interface Grade {
  id: string;
  label: string;
  order: number;
}

export interface Question {
  id: string;
  body: string;
  options: string[];
  correctIndex: number;
  subjectId: string | null;
  gradeId: string | null;
  difficulty: Difficulty;
  usesCount: number;
  subject?: Subject;
  grade?: Grade;
}

export interface Exam {
  id: string;
  name: string;
  subjectId: string | null;
  gradeId: string | null;
  durationMinutes: number;
  status: ExamStatus;
  createdBy: string;
  publishedAt: Date | null;
  createdAt: Date;
  subject?: Subject;
  grade?: Grade;
  questionCount?: number;
  assignedCount?: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  school: string | null;
  grade: string | null;
  dateOfBirth: string | null;
  sex: string | null;
  isComplete: boolean;
  studyStreak: number;
  bestStreak: number;
}

export interface ExamAssignment {
  id: string;
  examId: string;
  studentId: string;
  assignedAt: Date;
  status: AssignmentStatus;
  exam?: Exam;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, number>;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number | null;
  submittedAt: Date;
  exam?: Exam;
}

export interface ExamResult {
  submission: ExamSubmission;
  exam: Exam;
  questions: Question[];
}

export interface StudentSummary {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  grade: string | null;
  school: string | null;
  studyStreak: number;
  avgScore: number;
  completedCount: number;
  pendingCount: number;
  lastActive: string;
  status: 'active' | 'paused';
}

export interface GradeInfo {
  grade: string;
  label: string;
  color: string;
}
