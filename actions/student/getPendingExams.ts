'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examAssignments, exams, subjects, grades, examQuestions } from '@/db/schema';
import { studentProfiles } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import type { Exam } from '@/app/_lib/types';

export async function getPendingExams(limit?: number): Promise<Exam[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) return [];

  const rows = await db.query.examAssignments.findMany({
    where: and(
      eq(examAssignments.studentId, profile.id),
      eq(examAssignments.status, 'pending')
    ),
    with: {
      exam: {
        with: { subject: true, grade: true },
      },
    },
    orderBy: (ea, { desc }) => [desc(ea.assignedAt)],
    limit: limit ?? 100,
  });

  const result: Exam[] = [];
  for (const row of rows) {
    if (!row.exam) continue;
    const [qCount] = await db.select({ count: count() })
      .from(examQuestions).where(eq(examQuestions.examId, row.exam.id));
    result.push({
      id: row.exam.id,
      name: row.exam.name,
      subjectId: row.exam.subjectId,
      gradeId: row.exam.gradeId,
      durationMinutes: row.exam.durationMinutes,
      status: row.exam.status as 'published',
      createdBy: row.exam.createdBy,
      publishedAt: row.exam.publishedAt,
      createdAt: row.exam.createdAt,
      subject: row.exam.subject ?? undefined,
      grade: row.exam.grade ?? undefined,
      questionCount: qCount?.count ?? 0,
    });
  }
  return result;
}
