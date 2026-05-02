'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examAssignments } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function deleteAssignment(studentId: string, examId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  await db.delete(examAssignments).where(
    and(eq(examAssignments.studentId, studentId), eq(examAssignments.examId, examId)),
  );
}
