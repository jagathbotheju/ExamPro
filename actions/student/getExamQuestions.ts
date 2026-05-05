'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examQuestions, examAssignments, studentProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Question, Exam } from '@/app/_lib/types';

export async function getExamQuestions(examId: string): Promise<{ exam: Exam; questions: Question[] } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) return null;

  const assignment = await db.query.examAssignments.findFirst({
    where: and(
      eq(examAssignments.examId, examId),
      eq(examAssignments.studentId, profile.id),
    ),
    with: { exam: { with: { subject: true, grade: true } } },
  });
  if (!assignment?.exam) return null;

  const eqRows = await db.query.examQuestions.findMany({
    where: eq(examQuestions.examId, examId),
    with: { question: { with: { subject: true, grade: true } } },
    orderBy: (eq, { asc }) => [asc(eq.order)],
  });

  const questions: Question[] = eqRows
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
      imageUrl: r.question!.imageUrl ?? undefined,
      subject: r.question!.subject ?? undefined,
      grade: r.question!.grade ?? undefined,
    }));

  const e = assignment.exam;
  return {
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
