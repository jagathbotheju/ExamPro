'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getStudentPerformanceYears(studentId: string): Promise<number[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') return [];

  const rows = await db
    .select({ submittedAt: examSubmissions.submittedAt })
    .from(examSubmissions)
    .where(eq(examSubmissions.studentId, studentId));

  const years = [...new Set(rows.map(r => new Date(r.submittedAt).getFullYear()))].sort((a, b) => a - b);
  return years;
}
