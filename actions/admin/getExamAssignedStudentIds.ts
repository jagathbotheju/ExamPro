'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examAssignments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getExamAssignedStudentIds(examId: string): Promise<string[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const rows = await db.select({ studentId: examAssignments.studentId })
    .from(examAssignments)
    .where(eq(examAssignments.examId, examId));

  return rows.map(r => r.studentId);
}
