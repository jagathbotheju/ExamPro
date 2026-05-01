'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions, studentProfiles, exams, subjects } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface PerformancePoint {
  month: string;      // 'Jan'…'Dec' for monthly, '2023'…'2026' for yearly
  monthIndex: number; // 0–11 (monthly) or full year (yearly)
  score: number;      // avg score
  count: number;      // exams taken
}

export async function getPerformanceData(
  subjectSlug: string,
  timeframe: 'monthly' | 'yearly' = 'monthly',
): Promise<PerformancePoint[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) return [];

  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, subjectSlug),
  });
  if (!subject) return [];

  const rows = await db
    .select({ score: examSubmissions.score, submittedAt: examSubmissions.submittedAt })
    .from(examSubmissions)
    .innerJoin(exams, eq(exams.id, examSubmissions.examId))
    .where(
      and(
        eq(examSubmissions.studentId, profile.id),
        eq(exams.subjectId, subject.id),
      )
    );

  if (timeframe === 'yearly') {
    const buckets: Record<number, { total: number; count: number }> = {};
    for (const row of rows) {
      const y = new Date(row.submittedAt).getFullYear();
      if (!buckets[y]) buckets[y] = { total: 0, count: 0 };
      buckets[y].total += row.score;
      buckets[y].count += 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([yr, b]) => ({
        month: yr,
        monthIndex: Number(yr),
        score: Math.round(b.total / b.count),
        count: b.count,
      }));
  }

  // monthly — current year only
  const year = new Date().getFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end   = new Date(`${year}-12-31T23:59:59.999Z`);
  const yearRows = rows.filter(r => {
    const d = new Date(r.submittedAt);
    return d >= start && d <= end;
  });

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const buckets: { total: number; count: number }[] = Array.from({ length: 12 }, () => ({ total: 0, count: 0 }));
  for (const row of yearRows) {
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
