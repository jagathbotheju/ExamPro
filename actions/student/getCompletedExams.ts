'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions, studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { ExamSubmission } from '@/app/_lib/types';

export async function getCompletedExams(limit?: number): Promise<ExamSubmission[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) return [];

  const rows = await db.query.examSubmissions.findMany({
    where: eq(examSubmissions.studentId, profile.id),
    with: { exam: { with: { subject: true, grade: true } } },
    orderBy: (es, { desc }) => [desc(es.submittedAt)],
    limit: limit ?? 100,
  });

  return rows.map(r => ({
    id: r.id,
    examId: r.examId,
    studentId: r.studentId,
    answers: r.answers as Record<string, number>,
    score: r.score,
    correctCount: r.correctCount,
    totalQuestions: r.totalQuestions,
    timeSpentSeconds: r.timeSpentSeconds,
    submittedAt: r.submittedAt,
    exam: r.exam ? {
      id: r.exam.id, name: r.exam.name, subjectId: r.exam.subjectId,
      gradeId: r.exam.gradeId, durationMinutes: r.exam.durationMinutes,
      status: r.exam.status as 'published', createdBy: r.exam.createdBy,
      publishedAt: r.exam.publishedAt, createdAt: r.exam.createdAt,
      subject: r.exam.subject ?? undefined, grade: r.exam.grade ?? undefined,
    } : undefined,
  }));
}
