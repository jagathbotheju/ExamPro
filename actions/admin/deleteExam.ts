'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { exams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function deleteExam(examId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
  await db.delete(exams).where(eq(exams.id, examId));
  revalidatePath('/admin/exams');
}
