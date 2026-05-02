'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { examSubmissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function deleteSubmission(submissionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  await db.delete(examSubmissions).where(eq(examSubmissions.id, submissionId));
}
