export const queryKeys = {
  // Student
  profile: () => ['student', 'profile'] as const,
  pendingExams: (grade?: string, subject?: string) => ['exams', 'pending', { grade, subject }] as const,
  completedExams: (grade?: string, subject?: string) => ['exams', 'completed', { grade, subject }] as const,
  examQuestions: (examId: string) => ['exam', examId, 'questions'] as const,
  examResult: (examId: string) => ['exam', examId, 'result'] as const,
  performanceData: (subjectSlug: string) => ['student', 'performance', subjectSlug] as const,
  subjects: () => ['subjects'] as const,
  grades: () => ['grades'] as const,

  // Admin
  adminStudents: (page: number, search?: string) => ['admin', 'students', page, search] as const,
  adminStudentDetail: (studentId: string) => ['admin', 'student', studentId] as const,
  adminExams: (page: number, grade?: string, subject?: string) => ['admin', 'exams', page, { grade, subject }] as const,
  adminQuestions: (page: number, grade?: string, subject?: string, search?: string, unusedOnly?: boolean) =>
    ['admin', 'questions', page, { grade, subject, search, unusedOnly }] as const,
  adminStats: () => ['admin', 'stats'] as const,
};
