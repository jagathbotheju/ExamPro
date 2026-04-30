'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface QuestionInput {
  body: string;
  options: string[];
  correctIndex: number;
  subjectId: string;
  gradeId: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export async function createQuestion(input: QuestionInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
  const [q] = await db.insert(questions).values(input).returning();
  revalidatePath('/admin/questions');
  return q;
}

export async function updateQuestion(id: string, input: QuestionInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
  await db.update(questions).set({ ...input, updatedAt: new Date() }).where(eq(questions.id, id));
  revalidatePath('/admin/questions');
}

export async function deleteQuestion(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const _user = await currentUser();
  if (_user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
  await db.delete(questions).where(eq(questions.id, id));
  revalidatePath('/admin/questions');
}
