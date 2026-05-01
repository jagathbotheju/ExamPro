'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions, exams, subjects } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { PerformancePoint } from '@/actions/student/getPerformanceData';

export async function getStudentPerformanceData(
  studentId: string,
  subjectSlug: string,
): Promise<PerformancePoint[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') return [];

  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, subjectSlug),
  });
  if (!subject) return [];

  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end   = new Date(`${year}-12-31T23:59:59.999Z`);

  const rows = await db
    .select({ score: examSubmissions.score, submittedAt: examSubmissions.submittedAt })
    .from(examSubmissions)
    .innerJoin(exams, eq(exams.id, examSubmissions.examId))
    .where(
      and(
        eq(examSubmissions.studentId, studentId),
        eq(exams.subjectId, subject.id),
        gte(examSubmissions.submittedAt, start),
        lte(examSubmissions.submittedAt, end),
      )
    );

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const buckets: { total: number; count: number }[] = Array.from({ length: 12 }, () => ({ total: 0, count: 0 }));

  for (const row of rows) {
    const m = new Date(row.submittedAt).getMonth();
    buckets[m].total += row.score;
    buckets[m].count += 1;
  }

  return buckets
    .map((b, i) => ({
      month: MONTHS[i],
      monthIndex: i,
      score: b.count > 0 ? Math.round(b.total / b.count) : 0,
      count: b.count,
    }))
    .filter(p => p.count > 0);
}
