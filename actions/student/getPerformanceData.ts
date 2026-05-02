'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions, studentProfiles, exams, subjects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export type MultiPerformancePoint = {
  month: string;
  monthIndex: number;
  [slug: string]: string | number;
};

export async function getAllSubjectsPerformanceData(
  timeframe: 'monthly' | 'yearly' = 'monthly',
): Promise<MultiPerformancePoint[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) return [];

  const allSubjects = await db.query.subjects.findMany();
  if (allSubjects.length === 0) return [];

  const rows = await db
    .select({
      score: examSubmissions.score,
      submittedAt: examSubmissions.submittedAt,
      subjectId: exams.subjectId,
    })
    .from(examSubmissions)
    .innerJoin(exams, eq(exams.id, examSubmissions.examId))
    .where(eq(examSubmissions.studentId, profile.id));

  const subjectByIdMap = new Map(allSubjects.map(s => [s.id, s.slug]));

  if (timeframe === 'yearly') {
    const buckets: Record<number, Record<string, { total: number; count: number }>> = {};
    for (const row of rows) {
      const y = new Date(row.submittedAt).getFullYear();
      const slug = subjectByIdMap.get(row.subjectId ?? '') ?? 'unknown';
      if (!buckets[y]) buckets[y] = {};
      if (!buckets[y][slug]) buckets[y][slug] = { total: 0, count: 0 };
      buckets[y][slug].total += row.score;
      buckets[y][slug].count += 1;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([yr, slugBuckets]) => {
        const point: MultiPerformancePoint = { month: yr, monthIndex: Number(yr) };
        for (const [slug, b] of Object.entries(slugBuckets)) {
          point[slug] = b.count > 0 ? Math.round(b.total / b.count) : 0;
        }
        return point;
      });
  }

  const year = new Date().getFullYear();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const buckets: Record<number, Record<string, { total: number; count: number }>> = {};
  for (let i = 0; i < 12; i++) buckets[i] = {};

  for (const row of rows) {
    const d = new Date(row.submittedAt);
    if (d.getFullYear() !== year) continue;
    const m = d.getMonth();
    const slug = subjectByIdMap.get(row.subjectId ?? '') ?? 'unknown';
    if (!buckets[m][slug]) buckets[m][slug] = { total: 0, count: 0 };
    buckets[m][slug].total += row.score;
    buckets[m][slug].count += 1;
  }

  const points: MultiPerformancePoint[] = [];
  for (let i = 0; i < 12; i++) {
    const slugBuckets = buckets[i];
    if (Object.keys(slugBuckets).length === 0) continue;
    const point: MultiPerformancePoint = { month: MONTHS[i], monthIndex: i };
    for (const [slug, b] of Object.entries(slugBuckets)) {
      point[slug] = b.count > 0 ? Math.round(b.total / b.count) : 0;
    }
    points.push(point);
  }
  return points;
}

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
