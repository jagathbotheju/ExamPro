'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions, studentProfiles, exams } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type MultiPerformancePoint = {
  month: string;       // x-axis label: day number (monthly mode) or month abbr (yearly mode)
  monthIndex: number;  // day number (monthly) or month index 0-11 (yearly)
  [slug: string]: string | number;
};

export interface PerformancePoint {
  month: string;
  monthIndex: number;
  score: number;
  count: number;
}

export async function getPerformanceYears(): Promise<number[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) return [];

  const rows = await db
    .select({ submittedAt: examSubmissions.submittedAt })
    .from(examSubmissions)
    .where(eq(examSubmissions.studentId, profile.id));

  const years = [...new Set(rows.map(r => new Date(r.submittedAt).getFullYear()))].sort((a, b) => a - b);
  return years;
}

export async function getAllSubjectsPerformanceData(
  mode: 'monthly' | 'yearly',
  year: number,
  month = 0,
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

  if (mode === 'monthly') {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const buckets: Record<number, Record<string, number>> = {};
    for (let d = 1; d <= daysInMonth; d++) buckets[d] = {};

    for (const row of rows) {
      const d = new Date(row.submittedAt);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const slug = subjectByIdMap.get(row.subjectId ?? '') ?? 'unknown';
      buckets[day][slug] = Math.max(buckets[day][slug] ?? 0, row.score);
    }

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const point: MultiPerformancePoint = { month: String(day), monthIndex: day };
      for (const [slug, maxScore] of Object.entries(buckets[day])) {
        point[slug] = maxScore;
      }
      return point;
    });
  }

  // yearly: bucket by month, max score — always emit all 12 months
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const buckets: Record<number, Record<string, number>> = {};
  for (let m = 0; m < 12; m++) buckets[m] = {};

  for (const row of rows) {
    const d = new Date(row.submittedAt);
    if (d.getFullYear() !== year) continue;
    const m = d.getMonth();
    const slug = subjectByIdMap.get(row.subjectId ?? '') ?? 'unknown';
    buckets[m][slug] = Math.max(buckets[m][slug] ?? 0, row.score);
  }

  return MONTHS.map((label, mi) => {
    const point: MultiPerformancePoint = { month: label, monthIndex: mi };
    for (const [slug, maxScore] of Object.entries(buckets[mi])) {
      point[slug] = maxScore;
    }
    return point;
  });
}

