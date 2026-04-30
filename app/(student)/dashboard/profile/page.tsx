import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileTab } from '@/app/_components/student/profile-tab';

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const row = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!row?.isComplete) redirect('/onboarding');

  const profile = {
    id: row.id, userId: row.userId, name: row.name,
    email: row.email ?? null, school: row.school ?? null,
    grade: row.grade ?? null, dateOfBirth: row.dateOfBirth ?? null,
    sex: row.sex ?? null, isComplete: row.isComplete,
    studyStreak: row.studyStreak, bestStreak: row.bestStreak,
  };

  return <ProfileTab profile={profile} />;
}
