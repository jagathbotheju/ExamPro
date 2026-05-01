'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import type { Difficulty } from '@/app/_lib/types';

export interface BulkQuestionInput {
  body: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
  subjectId: string;
  gradeId: string;
}

export async function bulkCreateQuestions(inputs: BulkQuestionInput[]) {
  const { userId } = await auth();
  if (!userId) throw new Error('Forbidden');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');
  if (inputs.length === 0) return { inserted: 0 };

  await db.insert(questions).values(inputs);
  revalidatePath('/admin/questions');
  return { inserted: inputs.length };
}
