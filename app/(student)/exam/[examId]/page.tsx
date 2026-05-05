import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getExamQuestions } from '@/actions/student/getExamQuestions';
import { ActiveExam } from '@/app/_components/student/active-exam';

export default async function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { examId } = await params;
  const data = await getExamQuestions(examId);

  if (!data) {
    redirect('/dashboard');
  }
  console.log('active exam page')

  return <ActiveExam exam={data.exam} questions={data.questions} />;
}
