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

  // Get question IDs that students have previously answered incorrectly
  const incorrects = await db.query.incorrectAnswers.findMany({
    where: and(eq(incorrectAnswers.subjectId, subjectId), isNull(incorrectAnswers.resolvedAt)),
  });
  const incorrectQIds = new Set(incorrects.map(i => i.questionId));

  // Shuffle, but put incorrectly-answered questions first
  const priority = pool.filter(q => incorrectQIds.has(q.id));
  const rest = pool.filter(q => !incorrectQIds.has(q.id));
  const shuffledPriority = priority.sort(() => Math.random() - 0.5);
  const shuffledRest = rest.sort(() => Math.random() - 0.5);

  const selected = [...shuffledPriority, ...shuffledRest].slice(0, count);

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
