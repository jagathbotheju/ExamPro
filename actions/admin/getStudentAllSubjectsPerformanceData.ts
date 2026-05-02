'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions, exams, subjects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { MultiPerformancePoint } from '@/actions/student/getPerformanceData';

export async function getStudentAllSubjectsPerformanceData(
  studentId: string,
): Promise<MultiPerformancePoint[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') return [];

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
    .where(eq(examSubmissions.studentId, studentId));

  const subjectByIdMap = new Map(allSubjects.map(s => [s.id, s.slug]));
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
