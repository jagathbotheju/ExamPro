import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { studentProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingForm } from '@/app/_components/student/onboarding-form';

function nameFromEmail(email: string): string {
  const local = email.split('@')[0];
  const words = local
    .replace(/[._\-+]/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.join(' ') || local;
}

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const derivedName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || nameFromEmail(email);

  // Create profile row if it doesn't exist yet
  const existing = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });

  if (!existing) {
    await db.insert(studentProfiles).values({ userId, name: derivedName, email, isComplete: false }).onConflictDoNothing();
  }

  if (existing?.isComplete) redirect('/dashboard');

  // Use DB name if already set (user might have partially filled onboarding before)
  const name = existing?.name || derivedName;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>ExamPro</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Complete your profile to get started</div>
      </div>
      <OnboardingForm name={name} />
    </div>
  );
}
