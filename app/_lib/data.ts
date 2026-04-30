export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Exam {
  id: string;
  name: string;
  subject: string;
  published: string;
  questions: number;
  duration: number;
  completed?: string;
  score?: number;
}

export interface Question {
  id: string;
  body: string;
  options: string[];
  correct: number;
}

export interface StudentProfile {
  name: string;
  shortName: string;
  initials: string;
  school: string;
  grade: string;
  level: string;
  age: number;
  dob: string;
  sex: string;
  year: string;
  track: string;
  email: string;
  joined: string;
  examsTaken: number;
  accuracy: number;
  focusHours: number;
  rank: string;
  streak: number;
}

export interface PerformanceData {
  [subjectId: string]: {
    monthly: number[];
    yearly: number[];
  };
}

export interface ExamResult {
  exam: Exam;
  questions: Question[];
  answers: Record<string, number>;
  score: number;
  correctCount: number;
  total: number;
  timeSpent: number;
}

export const SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', color: '#7c5cff', icon: 'fa-square-root-variable' },
  { id: 'science', name: 'Science', color: '#22d3ee', icon: 'fa-flask' },
  { id: 'history', name: 'History', color: '#fbbf24', icon: 'fa-landmark' },
  { id: 'english', name: 'English', color: '#f472b6', icon: 'fa-book-open' },
  { id: 'buddhism', name: 'Buddhism', color: '#2dd4bf', icon: 'fa-dharmachakra' },
  { id: 'music', name: 'Music', color: '#fb7185', icon: 'fa-music' },
];

export const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];

export const PENDING_EXAMS: Exam[] = [
  { id: 'p1', name: 'Algebra Foundations', subject: 'math', published: 'Apr 22, 2026', questions: 25, duration: 30 },
  { id: 'p2', name: 'Cell Biology Quiz', subject: 'science', published: 'Apr 21, 2026', questions: 20, duration: 25 },
  { id: 'p3', name: 'World War II Essentials', subject: 'history', published: 'Apr 19, 2026', questions: 30, duration: 40 },
  { id: 'p4', name: 'Reading Comprehension', subject: 'english', published: 'Apr 18, 2026', questions: 15, duration: 20 },
  { id: 'p5', name: 'Geometry: Angles & Lines', subject: 'math', published: 'Apr 16, 2026', questions: 22, duration: 28 },
  { id: 'p6', name: 'Periodic Table Basics', subject: 'science', published: 'Apr 14, 2026', questions: 18, duration: 22 },
  { id: 'p7', name: 'Five Precepts in Daily Life', subject: 'buddhism', published: 'Apr 12, 2026', questions: 12, duration: 15 },
];

export const COMPLETED_EXAMS: Exam[] = [
  { id: 'c1', name: 'Linear Equations Test', subject: 'math', published: 'Apr 12, 2026', completed: 'Apr 14, 2026', score: 92, questions: 20, duration: 30 },
  { id: 'c2', name: 'Photosynthesis Deep Dive', subject: 'science', published: 'Apr 08, 2026', completed: 'Apr 10, 2026', score: 78, questions: 20, duration: 25 },
  { id: 'c3', name: 'Ancient Civilizations', subject: 'history', published: 'Apr 04, 2026', completed: 'Apr 06, 2026', score: 85, questions: 20, duration: 30 },
  { id: 'c4', name: 'Grammar & Tenses', subject: 'english', published: 'Mar 30, 2026', completed: 'Apr 02, 2026', score: 96, questions: 20, duration: 25 },
  { id: 'c5', name: 'Fractions & Decimals', subject: 'math', published: 'Mar 25, 2026', completed: 'Mar 27, 2026', score: 71, questions: 20, duration: 30 },
  { id: 'c6', name: 'States of Matter', subject: 'science', published: 'Mar 20, 2026', completed: 'Mar 22, 2026', score: 88, questions: 20, duration: 25 },
  { id: 'c7', name: 'Noble Eightfold Path', subject: 'buddhism', published: 'Mar 16, 2026', completed: 'Mar 18, 2026', score: 94, questions: 20, duration: 20 },
];

export const ACTIVE_EXAM_QUESTIONS: Question[] = [
  { id: 'q1', body: 'Solve for x:  3x + 7 = 22', options: ['x = 3', 'x = 5', 'x = 7', 'x = 15'], correct: 1 },
  { id: 'q2', body: 'Which expression is equivalent to  2(x + 4) − 3x ?', options: ['−x + 8', 'x + 8', '5x + 8', '−x + 4'], correct: 0 },
  { id: 'q3', body: 'If  f(x) = 2x² − 3x + 1, what is  f(2)?', options: ['1', '3', '5', '7'], correct: 1 },
  { id: 'q4', body: 'The slope of the line passing through (1, 2) and (4, 11) is:', options: ['2', '3', '4', '9'], correct: 1 },
  { id: 'q5', body: 'Factor completely:  x² − 9', options: ['(x − 3)²', '(x + 3)(x − 3)', '(x + 9)(x − 1)', 'cannot be factored'], correct: 1 },
  { id: 'q6', body: 'Which value of x satisfies  |x − 4| = 6 ?', options: ['only x = 10', 'only x = −2', 'x = 10 or x = −2', 'no solution'], correct: 2 },
  { id: 'q7', body: 'Simplify:  (3x²)(4x³)', options: ['7x⁵', '12x⁵', '12x⁶', '7x⁶'], correct: 1 },
  { id: 'q8', body: 'A line is perpendicular to  y = (1/2)x + 3. Its slope is:', options: ['1/2', '−1/2', '2', '−2'], correct: 3 },
  { id: 'q9', body: 'The roots of  x² − 5x + 6 = 0  are:', options: ['1 and 6', '2 and 3', '−2 and −3', '−1 and −6'], correct: 1 },
  { id: 'q10', body: 'If  log₁₀(x) = 2, then x =', options: ['10', '20', '100', '1000'], correct: 2 },
];

export const PERFORMANCE_DATA: PerformanceData = {
  math:     { monthly: [62, 68, 72, 70, 78, 82, 85, 88, 84, 91, 89, 94], yearly: [55, 62, 71, 78, 85, 92] },
  science:  { monthly: [70, 73, 71, 76, 79, 81, 78, 84, 86, 83, 87, 90], yearly: [60, 66, 72, 78, 83, 88] },
  history:  { monthly: [80, 82, 78, 85, 84, 88, 90, 87, 92, 89, 93, 95], yearly: [70, 75, 80, 85, 89, 93] },
  english:  { monthly: [88, 90, 89, 92, 91, 94, 93, 95, 94, 96, 95, 97], yearly: [78, 84, 88, 92, 95, 96] },
  buddhism: { monthly: [75, 78, 80, 82, 85, 87, 84, 88, 90, 89, 92, 94], yearly: [65, 72, 79, 84, 89, 93] },
  music:    { monthly: [60, 65, 68, 70, 72, 75, 78, 76, 80, 82, 85, 87], yearly: [50, 58, 66, 73, 80, 86] },
};

export const MONTH_LABELS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
export const YEAR_LABELS = ['2021', '2022', '2023', '2024', '2025', '2026'];

export const STUDENT_PROFILE: StudentProfile = {
  name: 'Alexander James Chen',
  shortName: 'Alexander Chen',
  initials: 'AC',
  school: 'Standford University of Medicine',
  grade: 'Grade 9',
  level: 'Senior Fellow (L7)',
  age: 24,
  dob: '2002-03-14',
  sex: 'Male',
  year: 'Year 4',
  track: 'Medical Sciences Candidate',
  email: 'alex.chen@stanford.edu',
  joined: 'Sep 2023',
  examsTaken: 42,
  accuracy: 94,
  focusHours: 128,
  rank: 'Top 5%',
  streak: 14,
};
