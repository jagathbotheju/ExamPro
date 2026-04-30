'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { StudentProfile } from '@/app/_lib/types';

export async function getProfile(): Promise<StudentProfile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const row = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email ?? null,
    school: row.school ?? null,
    grade: row.grade ?? null,
    dateOfBirth: row.dateOfBirth ?? null,
    sex: row.sex ?? null,
    isComplete: row.isComplete,
    studyStreak: row.studyStreak,
    bestStreak: row.bestStreak,
  };
}
