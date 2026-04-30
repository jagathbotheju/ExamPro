'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface UpdateProfileInput {
  name?: string;
  school?: string;
  grade?: string;
  dateOfBirth?: string;
  sex?: string;
}

export async function updateProfile(data: UpdateProfileInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const existing = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });

  const merged = { ...existing, ...data };
  const isComplete = !!(merged.name && merged.school && merged.grade && merged.dateOfBirth && merged.sex);

  await db.update(studentProfiles)
    .set({ ...data, isComplete, updatedAt: new Date() })
    .where(eq(studentProfiles.userId, userId));

  revalidatePath('/dashboard');
  revalidatePath('/onboarding');
  return { isComplete };
}
