'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examQuestions, examAssignments } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import type { Exam, Question } from '@/app/_lib/types';

export interface ExamDetail {
  exam: Exam;
  questions: Question[];
  assignedCount: number;
}

export async function getExamDetail(examId: string): Promise<ExamDetail> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const exam = await db.query.exams.findFirst({
    where: (e, { eq }) => eq(e.id, examId),
    with: { subject: true, grade: true },
  });
  if (!exam) throw new Error('Exam not found');

  const eqs = await db.query.examQuestions.findMany({
    where: eq(examQuestions.examId, examId),
    with: { question: { with: { subject: true, grade: true } } },
    orderBy: (eq, { asc }) => [asc(eq.order)],
  });

  const [aCount] = await db.select({ count: count() }).from(examAssignments).where(eq(examAssignments.examId, examId));

  const questions: Question[] = eqs.map(eq => ({
    id: eq.question.id,
    body: eq.question.body,
    options: eq.question.options,
    correctIndex: eq.question.correctIndex,
    subjectId: eq.question.subjectId,
    gradeId: eq.question.gradeId,
    difficulty: eq.question.difficulty as Question['difficulty'],
    usesCount: eq.question.usesCount,
    subject: eq.question.subject ?? undefined,
    grade: eq.question.grade ?? undefined,
  }));

  return {
    exam: {
      id: exam.id, name: exam.name, subjectId: exam.subjectId, gradeId: exam.gradeId,
      durationMinutes: exam.durationMinutes, status: exam.status as Exam['status'],
      createdBy: exam.createdBy, publishedAt: exam.publishedAt, createdAt: exam.createdAt,
      subject: exam.subject ?? undefined, grade: exam.grade ?? undefined,
      questionCount: eqs.length, assignedCount: aCount?.count ?? 0,
    },
    questions,
    assignedCount: aCount?.count ?? 0,
  };
}
