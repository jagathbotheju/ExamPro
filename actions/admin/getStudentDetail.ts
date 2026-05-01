'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examAssignments, examSubmissions, examQuestions } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import type { Exam, ExamSubmission } from '@/app/_lib/types';

const PAGE_SIZE = 4;

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
}

export async function getStudentPendingExams(
  studentId: string,
  page = 1,
): Promise<{ exams: Exam[]; total: number; pages: number }> {
  await assertAdmin();

  const rows = await db.query.examAssignments.findMany({
    where: and(
      eq(examAssignments.studentId, studentId),
      eq(examAssignments.status, 'pending'),
    ),
    with: { exam: { with: { subject: true, grade: true } } },
    orderBy: (ea, { desc }) => [desc(ea.assignedAt)],
  });

  const validRows = rows.filter(r => r.exam);
  const total = validRows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = validRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exams: Exam[] = await Promise.all(slice.map(async r => {
    const [qCount] = await db.select({ count: count() })
      .from(examQuestions).where(eq(examQuestions.examId, r.exam!.id));
    return {
      id: r.exam!.id,
      name: r.exam!.name,
      subjectId: r.exam!.subjectId,
      gradeId: r.exam!.gradeId,
      durationMinutes: r.exam!.durationMinutes,
      status: r.exam!.status as 'published',
      createdBy: r.exam!.createdBy,
      publishedAt: r.exam!.publishedAt,
      createdAt: r.exam!.createdAt,
      subject: r.exam!.subject ?? undefined,
      grade: r.exam!.grade ?? undefined,
      questionCount: qCount?.count ?? 0,
    };
  }));

  return { exams, total, pages };
}

export async function getStudentCompletedExams(
  studentId: string,
  page = 1,
): Promise<{ submissions: ExamSubmission[]; total: number; pages: number }> {
  await assertAdmin();

  const rows = await db.query.examSubmissions.findMany({
    where: eq(examSubmissions.studentId, studentId),
    with: { exam: { with: { subject: true, grade: true } } },
    orderBy: (es, { desc }) => [desc(es.submittedAt)],
  });

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const submissions: ExamSubmission[] = slice.map(r => ({
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

  return { submissions, total, pages };
}
