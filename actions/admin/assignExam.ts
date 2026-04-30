'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examAssignments } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function assignExam(examId: string, studentIds: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  for (const studentId of studentIds) {
    const existing = await db.query.examAssignments.findFirst({
      where: and(eq(examAssignments.examId, examId), eq(examAssignments.studentId, studentId)),
    });
    if (!existing) {
      await db.insert(examAssignments).values({ examId, studentId, status: 'pending' });
    }
  }
  revalidatePath('/admin/exams');
}
