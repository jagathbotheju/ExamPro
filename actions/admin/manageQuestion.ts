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
  imageUrl?: string | null;
}

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
}

export async function createQuestion(input: QuestionInput) {
  await assertAdmin();
  const [q] = await db.insert(questions).values(input).returning();
  revalidatePath('/admin/questions');
  return q;
}

export async function updateQuestion(id: string, input: QuestionInput) {
  await assertAdmin();
  await db.update(questions).set({ ...input, updatedAt: new Date() }).where(eq(questions.id, id));
  revalidatePath('/admin/questions');
}

export async function deleteQuestion(id: string) {
  await assertAdmin();
  await db.delete(questions).where(eq(questions.id, id));
  revalidatePath('/admin/questions');
}
