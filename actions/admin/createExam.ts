'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { exams, examQuestions, questions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface CreateExamInput {
  name: string;
  subjectId: string;
  gradeId: string;
  durationMinutes: number;
  questionIds: string[];
}

export async function createExam(input: CreateExamInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') throw new Error('Forbidden');

  const [exam] = await db.insert(exams).values({
    name: input.name,
    subjectId: input.subjectId,
    gradeId: input.gradeId,
    durationMinutes: input.durationMinutes,
    status: 'published',
    createdBy: userId!,
    publishedAt: new Date(),
  }).returning();

  if (input.questionIds.length > 0) {
    await db.insert(examQuestions).values(
      input.questionIds.map((qId, i) => ({
        examId: exam.id,
        questionId: qId,
        order: i,
      }))
    );
    // Increment uses count
    for (const qId of input.questionIds) {
      const q = await db.query.questions.findFirst({ where: eq(questions.id, qId) });
      if (q) await db.update(questions).set({ usesCount: q.usesCount + 1 }).where(eq(questions.id, qId));
    }
  }

  revalidatePath('/admin/exams');
  return exam;
}
