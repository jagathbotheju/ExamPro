'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import type { Question } from '@/app/_lib/types';

const PAGE_SIZE = 10;

export async function getAdminQuestions(page = 1, gradeId?: string, subjectId?: string, search = ''): Promise<{ questions: Question[]; total: number; pages: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const all = await db.query.questions.findMany({
    with: { subject: true, grade: true },
    orderBy: (q, { desc }) => [desc(q.createdAt)],
  });

  const filtered = all.filter(q =>
    (!gradeId || q.gradeId === gradeId) &&
    (!subjectId || q.subjectId === subjectId) &&
    (!search || q.body.toLowerCase().includes(search.toLowerCase()))
  );

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    questions: slice.map(q => ({
      id: q.id, body: q.body,
      options: q.options as string[],
      correctIndex: q.correctIndex,
      subjectId: q.subjectId, gradeId: q.gradeId,
      difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
      usesCount: q.usesCount,
      subject: q.subject ?? undefined,
      grade: q.grade ?? undefined,
    })),
    total, pages,
  };
}
