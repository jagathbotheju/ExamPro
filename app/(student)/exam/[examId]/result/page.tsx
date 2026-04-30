import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getExamResult } from '@/actions/student/getExamResult';
import { ExamResults } from '@/app/_components/student/exam-results';

export default async function ExamResultPage({ params }: { params: Promise<{ examId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { examId } = await params;
  const result = await getExamResult(examId);
  if (!result) redirect('/dashboard');

  return <ExamResults result={result} />;
}
