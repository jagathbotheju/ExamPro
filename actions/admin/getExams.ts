'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { exams, examQuestions, examAssignments } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import type { Exam } from '@/app/_lib/types';

const PAGE_SIZE = 10;

export async function getAdminExams(page = 1, gradeId?: string, subjectId?: string): Promise<{ exams: Exam[]; total: number; pages: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const allExams = await db.query.exams.findMany({
    with: { subject: true, grade: true },
    orderBy: (e, { desc }) => [desc(e.createdAt)],
  });

  const filtered = allExams.filter(e =>
    (!gradeId || e.gradeId === gradeId) &&
    (!subjectId || e.subjectId === subjectId)
  );

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const result: Exam[] = await Promise.all(slice.map(async e => {
    const [qCount] = await db.select({ count: count() }).from(examQuestions).where(eq(examQuestions.examId, e.id));
    const [aCount] = await db.select({ count: count() }).from(examAssignments).where(eq(examAssignments.examId, e.id));
    return {
      id: e.id, name: e.name, subjectId: e.subjectId, gradeId: e.gradeId,
      durationMinutes: e.durationMinutes, status: e.status as Exam['status'],
      createdBy: e.createdBy, publishedAt: e.publishedAt, createdAt: e.createdAt,
      subject: e.subject ?? undefined, grade: e.grade ?? undefined,
      questionCount: qCount?.count ?? 0, assignedCount: aCount?.count ?? 0,
    };
  }));

  return { exams: result, total, pages };
}
