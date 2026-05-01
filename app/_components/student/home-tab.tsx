'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Target, Flame, ChevronRight, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ScoreRing } from '@/app/_components/shared/score-ring';
import { StatTile } from '@/app/_components/shared/stat-tile';
import { PerformanceChart } from '@/app/_components/shared/performance-chart';
import { PendingExamRow, CompletedExamRow } from '@/app/_components/shared/exam-row';
import { getInitials } from '@/app/_lib/utils';
import { getPendingExams } from '@/actions/student/getPendingExams';
import { getCompletedExams } from '@/actions/student/getCompletedExams';
import { getPerformanceData } from '@/actions/student/getPerformanceData';
import { getSubjects } from '@/actions/admin/manageSubjectsGrades';
import { queryKeys } from '@/app/_lib/query-keys';
import type { StudentProfile } from '@/app/_lib/types';

interface HomeTabProps { profile: StudentProfile | null }

export function HomeTab({ profile }: HomeTabProps) {
  const router = useRouter();
  const [subjectSlug, setSubjectSlug] = useState('math');
  const [tf, setTf] = useState<'monthly' | 'yearly'>('monthly');

  const { data: pending = [] } = useQuery({
    queryKey: queryKeys.pendingExams(),
    queryFn: () => getPendingExams(5),
  });
  const { data: completed = [] } = useQuery({
    queryKey: queryKeys.completedExams(),
    queryFn: () => getCompletedExams(5),
  });
  const { data: subjects = [] } = useQuery({
    queryKey: queryKeys.subjects(),
    queryFn: getSubjects,
  });
  const { data: performanceData = [] } = useQuery({
    queryKey: queryKeys.performanceData(subjectSlug, tf),
    queryFn: () => getPerformanceData(subjectSlug, tf),
  });

  const avgScore = completed.length
    ? Math.round(completed.reduce((s, c) => s + c.score, 0) / completed.length)
    : 0;
  const initials = profile ? getInitials(profile.name) : '?';
  const firstName = profile?.name?.split(' ')[0] ?? 'Student';
  const rank = avgScore >= 90 ? 'Gold' : avgScore >= 75 ? 'Silver' : 'Bronze';

  const activeSubject = subjects.find(s => s.slug === subjectSlug);

  // Default to first DB subject if 'math' not found
  const resolvedSlug = activeSubject ? subjectSlug : (subjects[0]?.slug ?? 'math');
  const resolvedSubject = activeSubject ?? subjects[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero card */}
      <div className="card card-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="avatar-lg">{initials}</div>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <span className="pill pill-green">PREMIUM LEARNER</span>
                <span className="pill pill-purple">{rank.toUpperCase()} RANK</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>
                Welcome back, {firstName}.
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {profile?.grade ?? 'Student'} · ExamPro
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <ScoreRing score={avgScore} size={190} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Overall Score
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <StatTile icon={CheckCircle2} iconColor="var(--green)" label="Completed" value={completed.length} trend="exams done" />
        <StatTile icon={Clock}        iconColor="var(--amber)" label="Pending"   value={pending.length}   trend="awaiting" />
        <StatTile icon={Target}       iconColor="var(--cyan)"  label="Avg Accuracy" value={`${avgScore}%`} trend="all exams" />
        <StatTile icon={Flame}        iconColor="var(--accent)" label="Study Streak" value={profile?.studyStreak ?? 0} trend={`Best: ${profile?.bestStreak ?? 0}`} />
      </div>

      {/* Performance Analytics */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <BarChart2 size={15} /> Performance Analytics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {subjects.length > 0 && (
              <select
                className="input"
                style={{ height: 32, fontSize: 12, padding: '0 10px', minWidth: 130 }}
                value={resolvedSlug}
                onChange={e => setSubjectSlug(e.target.value)}
              >
                {subjects.map(s => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            )}
            <div className="seg">
              <button className={`seg-btn ${tf === 'monthly' ? 'active' : ''}`} onClick={() => setTf('monthly')}>Monthly</button>
              <button className={`seg-btn ${tf === 'yearly'  ? 'active' : ''}`} onClick={() => setTf('yearly')}>Yearly</button>
            </div>
          </div>
        </div>
        <PerformanceChart
          data={performanceData}
          subjectSlug={resolvedSlug}
          subjectColor={resolvedSubject?.color ?? 'var(--accent)'}
        />
      </div>

      {/* Pending Exams */}
      <div className="card">
        <div className="section-header">
          <div className="card-title" style={{ margin: 0 }}>Pending Exams</div>
          <Link href="/dashboard/exams" className="btn btn-ghost btn-sm">View all <ChevronRight size={12} /></Link>
        </div>
        {pending.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No pending exams right now.
          </div>
        ) : (
          <div className="list">
            {pending.slice(0, 5).map(exam => (
              <PendingExamRow key={exam.id} exam={exam} onStart={e => router.push(`/exam/${e.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Exams */}
      <div className="card">
        <div className="section-header">
          <div className="card-title" style={{ margin: 0 }}>Recently Completed</div>
          <Link href="/dashboard/exams" className="btn btn-ghost btn-sm">View all <ChevronRight size={12} /></Link>
        </div>
        {completed.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No completed exams yet.
          </div>
        ) : (
          <div className="list">
            {completed.slice(0, 5).map(sub => (
              <CompletedExamRow key={sub.id} submission={sub} onView={s => router.push(`/exam/${s.examId}/result`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
