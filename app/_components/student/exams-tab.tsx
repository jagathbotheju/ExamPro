'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Target, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatTile } from '@/app/_components/shared/stat-tile';
import { PendingExamRow, CompletedExamRow } from '@/app/_components/shared/exam-row';
import { Pagination } from '@/app/_components/shared/pagination';
import { getPendingExams } from '@/actions/student/getPendingExams';
import { getCompletedExams } from '@/actions/student/getCompletedExams';
import { queryKeys } from '@/app/_lib/query-keys';
import type { StudentProfile } from '@/app/_lib/types';

const SUBJECTS = [
  { slug: 'math', name: 'Mathematics' }, { slug: 'science', name: 'Science' },
  { slug: 'history', name: 'History' }, { slug: 'english', name: 'English' },
  { slug: 'buddhism', name: 'Buddhism' }, { slug: 'music', name: 'Music' },
];
const PAGE = 5;

interface ExamsTabProps { profile: StudentProfile | null }

export function ExamsTab({ profile }: ExamsTabProps) {
  const router = useRouter();
  const [subjectFilter, setSubjectFilter] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

  const { data: allPending = [] } = useQuery({
    queryKey: queryKeys.pendingExams(),
    queryFn: () => getPendingExams(),
  });
  const { data: allCompleted = [] } = useQuery({
    queryKey: queryKeys.completedExams(),
    queryFn: () => getCompletedExams(),
  });

  const filteredPending = subjectFilter
    ? allPending.filter(e => e.subject?.slug === subjectFilter || e.subjectId === subjectFilter)
    : allPending;
  const filteredCompleted = subjectFilter
    ? allCompleted.filter(s => s.exam?.subject?.slug === subjectFilter)
    : allCompleted;

  const pendingSlice = filteredPending.slice((pendingPage - 1) * PAGE, pendingPage * PAGE);
  const completedSlice = filteredCompleted.slice((completedPage - 1) * PAGE, completedPage * PAGE);

  const avgScore = allCompleted.length
    ? Math.round(allCompleted.reduce((s, c) => s + c.score, 0) / allCompleted.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>Exams</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {profile?.grade ?? 'All Grades'} · Filter and manage your exams
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="label-tiny" style={{ marginRight: 4 }}>Filter by</span>
        <select className="select" value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPendingPage(1); setCompletedPage(1); }}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {filteredPending.length} pending · {filteredCompleted.length} completed
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <StatTile icon={CheckCircle2} iconColor="var(--green)"  label="Completed"    value={allCompleted.length} trend="total" />
        <StatTile icon={Clock}        iconColor="var(--amber)"  label="Pending"      value={allPending.length}   trend="assigned" />
        <StatTile icon={Target}       iconColor="var(--cyan)"   label="Avg Score"    value={`${avgScore}%`}      trend="all time" />
        <StatTile icon={Flame}        iconColor="var(--accent)" label="Study Streak" value={profile?.studyStreak ?? 0} trend="days" />
      </div>

      {/* Pending */}
      <div className="card">
        <div className="card-title">Pending Exams ({filteredPending.length})</div>
        {pendingSlice.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No pending exams.</div>
        ) : (
          <div className="list">
            {pendingSlice.map(exam => (
              <PendingExamRow key={exam.id} exam={exam} onStart={e => router.push(`/exam/${e.id}`)} />
            ))}
          </div>
        )}
        <Pagination page={pendingPage} total={Math.ceil(filteredPending.length / PAGE)} onPage={setPendingPage} />
      </div>

      {/* Completed */}
      <div className="card">
        <div className="card-title">Completed Exams ({filteredCompleted.length})</div>
        {completedSlice.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No completed exams yet.</div>
        ) : (
          <div className="list">
            {completedSlice.map(sub => (
              <CompletedExamRow key={sub.id} submission={sub} onView={s => router.push(`/exam/${s.examId}/result`)} />
            ))}
          </div>
        )}
        <Pagination page={completedPage} total={Math.ceil(filteredCompleted.length / PAGE)} onPage={setCompletedPage} />
      </div>
    </div>
  );
}
