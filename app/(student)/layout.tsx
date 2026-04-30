import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { StudentSidebar } from '@/app/_components/student/sidebar';
import { StudentTopbar } from '@/app/_components/student/topbar';
import type { StudentProfile } from '@/app/_lib/types';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  let profile: StudentProfile | null = null;
  const row = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });

  if (row) {
    profile = {
      id: row.id, userId: row.userId, name: row.name,
      email: row.email ?? null, school: row.school ?? null,
      grade: row.grade ?? null, dateOfBirth: row.dateOfBirth ?? null,
      sex: row.sex ?? null, isComplete: row.isComplete,
      studyStreak: row.studyStreak, bestStreak: row.bestStreak,
    };
  }

  return (
    <div className="app">
      <StudentSidebar profile={profile} />
      <div className="app-main">
        <StudentTopbar profile={profile} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
