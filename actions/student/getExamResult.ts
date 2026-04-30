'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions, examQuestions, studentProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ExamResult } from '@/app/_lib/types';

export async function getExamResult(examId: string): Promise<ExamResult | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) return null;

  const submission = await db.query.examSubmissions.findFirst({
    where: and(
      eq(examSubmissions.examId, examId),
      eq(examSubmissions.studentId, profile.id),
    ),
    with: { exam: { with: { subject: true, grade: true } } },
    orderBy: (s, { desc }) => [desc(s.submittedAt)],
  });
  if (!submission?.exam) return null;

  const eqRows = await db.query.examQuestions.findMany({
    where: eq(examQuestions.examId, examId),
    with: { question: { with: { subject: true, grade: true } } },
    orderBy: (eq, { asc }) => [asc(eq.order)],
  });

  const questions = eqRows
    .filter(r => r.question)
    .map(r => ({
      id: r.question!.id,
      body: r.question!.body,
      options: r.question!.options as string[],
      correctIndex: r.question!.correctIndex,
      subjectId: r.question!.subjectId,
      gradeId: r.question!.gradeId,
      difficulty: r.question!.difficulty as 'Easy' | 'Medium' | 'Hard',
      usesCount: r.question!.usesCount,
      subject: r.question!.subject ?? undefined,
      grade: r.question!.grade ?? undefined,
    }));

  const e = submission.exam;
  return {
    submission: {
      id: submission.id,
      examId: submission.examId,
      studentId: submission.studentId,
      answers: submission.answers as Record<string, number>,
      score: submission.score,
      correctCount: submission.correctCount,
      totalQuestions: submission.totalQuestions,
      timeSpentSeconds: submission.timeSpentSeconds,
      submittedAt: submission.submittedAt,
    },
    exam: {
      id: e.id, name: e.name, subjectId: e.subjectId, gradeId: e.gradeId,
      durationMinutes: e.durationMinutes, status: e.status as 'published',
      createdBy: e.createdBy, publishedAt: e.publishedAt, createdAt: e.createdAt,
      subject: e.subject ?? undefined, grade: e.grade ?? undefined,
      questionCount: questions.length,
    },
    questions,
  };
}
