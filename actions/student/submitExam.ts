'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import {
  examSubmissions, examAssignments, incorrectAnswers,
  studentProfiles, examQuestions, questions,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface SubmitExamInput {
  examId: string;
  answers: Record<string, number>;
  timeSpentSeconds: number;
}

export async function submitExam({ examId, answers, timeSpentSeconds }: SubmitExamInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const profile = await db.query.studentProfiles.findFirst({
    where: eq(studentProfiles.userId, userId),
  });
  if (!profile) throw new Error('Profile not found');

  const eqRows = await db.query.examQuestions.findMany({
    where: eq(examQuestions.examId, examId),
    with: { question: true },
    orderBy: (eq, { asc }) => [asc(eq.order)],
  });

  let correct = 0;
  const total = eqRows.length;

  for (const row of eqRows) {
    if (!row.question) continue;
    const q = row.question;
    const selected = answers[q.id];
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) correct++;

    // Track incorrectly answered questions
    if (!isCorrect) {
      const existing = await db.query.incorrectAnswers.findFirst({
        where: and(
          eq(incorrectAnswers.studentId, profile.id),
          eq(incorrectAnswers.questionId, q.id),
        ),
      });
      if (existing) {
        await db.update(incorrectAnswers)
          .set({
            incorrectCount: existing.incorrectCount + 1,
            lastIncorrectAt: new Date(),
            resolvedAt: null,
          })
          .where(eq(incorrectAnswers.id, existing.id));
      } else {
        await db.insert(incorrectAnswers).values({
          studentId: profile.id,
          questionId: q.id,
          subjectId: q.subjectId,
          incorrectCount: 1,
        });
      }
    } else {
      // Mark as resolved if previously incorrect
      const existing = await db.query.incorrectAnswers.findFirst({
        where: and(
          eq(incorrectAnswers.studentId, profile.id),
          eq(incorrectAnswers.questionId, q.id),
        ),
      });
      if (existing && !existing.resolvedAt) {
        await db.update(incorrectAnswers)
          .set({ resolvedAt: new Date() })
          .where(eq(incorrectAnswers.id, existing.id));
      }
    }
  }

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [submission] = await db.insert(examSubmissions).values({
    examId,
    studentId: profile.id,
    answers,
    score,
    correctCount: correct,
    totalQuestions: total,
    timeSpentSeconds,
  }).returning();

  // Mark assignment as completed
  await db.update(examAssignments)
    .set({ status: 'completed' })
    .where(and(
      eq(examAssignments.examId, examId),
      eq(examAssignments.studentId, profile.id),
    ));

  revalidatePath('/dashboard');
  return { submissionId: submission.id, score };
}
