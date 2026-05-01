'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { questions, incorrectAnswers } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { Question } from '@/app/_lib/types';

export async function loadQuestionsFromBank(
  subjectId: string,
  gradeId: string,
  count: number,
): Promise<Question[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const pool = await db.query.questions.findMany({
    where: and(eq(questions.subjectId, subjectId), eq(questions.gradeId, gradeId)),
    with: { subject: true, grade: true },
  });

  // Get question IDs that students have previously answered incorrectly (unresolved)
  const incorrects = await db.query.incorrectAnswers.findMany({
    where: and(eq(incorrectAnswers.subjectId, subjectId), isNull(incorrectAnswers.resolvedAt)),
  });
  const incorrectQIds = new Set(incorrects.map(i => i.questionId));

  // 3-tier priority, each tier shuffled independently:
  // Tier 1 — unused (usesCount === 0): brand-new questions never in any exam
  // Tier 2 — incorrectly answered (usesCount > 0): students struggled with these
  // Tier 3 — everything else: used and not flagged
  const shuffle = <T,>(arr: T[]): T[] => arr.slice().sort(() => Math.random() - 0.5);

  const unused    = shuffle(pool.filter(q => (q.usesCount ?? 0) === 0));
  const incorrect = shuffle(pool.filter(q => (q.usesCount ?? 0) > 0 && incorrectQIds.has(q.id)));
  const other     = shuffle(pool.filter(q => (q.usesCount ?? 0) > 0 && !incorrectQIds.has(q.id)));

  const selected = [...unused, ...incorrect, ...other].slice(0, count);

  return selected.map(q => ({
    id: q.id, body: q.body,
    options: q.options as string[],
    correctIndex: q.correctIndex,
    subjectId: q.subjectId, gradeId: q.gradeId,
    difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
    usesCount: q.usesCount,
    subject: q.subject ?? undefined, grade: q.grade ?? undefined,
  }));
}
