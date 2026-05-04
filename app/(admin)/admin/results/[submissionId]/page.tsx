import { redirect } from 'next/navigation';
import { getExamResultBySubmissionId } from '@/actions/admin/getExamResultBySubmissionId';
import { ExamResults } from '@/app/_components/student/exam-results';

export default async function AdminExamResultPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  const result = await getExamResultBySubmissionId(submissionId);
  if (!result) redirect('/admin');

  return <ExamResults result={result} backHref="/admin" />;
}
