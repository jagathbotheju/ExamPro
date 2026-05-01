'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { questions, incorrectAnswers } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { Question } from '@/app/_lib/types';

export type QuestionTier = 'unused' | 'incorrect' | 'other';

export interface PoolQuestion extends Question {
  tier: QuestionTier;
}

// Returns ALL questions for a subject+grade with priority tier metadata.
// Tier 1 "unused"    — usesCount === 0 (never been in any exam)
// Tier 2 "incorrect" — usesCount > 0 AND at least one student answered it wrong (unresolved)
// Tier 3 "other"     — used and not flagged as incorrect
export async function getQuestionPool(subjectId: string, gradeId: string): Promise<PoolQuestion[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const pool = await db.query.questions.findMany({
    where: and(eq(questions.subjectId, subjectId), eq(questions.gradeId, gradeId)),
    with: { subject: true, grade: true },
    orderBy: (q, { asc }) => [asc(q.createdAt)],
  });

  const incorrects = await db.query.incorrectAnswers.findMany({
    where: and(eq(incorrectAnswers.subjectId, subjectId), isNull(incorrectAnswers.resolvedAt)),
  });
  const incorrectQIds = new Set(incorrects.map(i => i.questionId));

  const toTier = (usesCount: number, id: string): QuestionTier => {
    if (usesCount === 0) return 'unused';
    if (incorrectQIds.has(id)) return 'incorrect';
    return 'other';
  };

  // Sort: unused first, then incorrect, then other
  const tierOrder: Record<QuestionTier, number> = { unused: 0, incorrect: 1, other: 2 };

  return pool
    .map(q => ({
      id: q.id,
      body: q.body,
      options: q.options as string[],
      correctIndex: q.correctIndex,
      subjectId: q.subjectId,
      gradeId: q.gradeId,
      difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
      usesCount: q.usesCount ?? 0,
      subject: q.subject ?? undefined,
      grade: q.grade ?? undefined,
      tier: toTier(q.usesCount ?? 0, q.id),
    }))
    .sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
}
