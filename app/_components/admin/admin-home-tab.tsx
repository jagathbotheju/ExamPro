'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Database, BarChart2, ChevronRight } from 'lucide-react';
import { StatTile } from '@/app/_components/shared/stat-tile';
import { SubjectBlock } from '@/app/_components/shared/subject-block';
import { PerformanceChart } from '@/app/_components/shared/performance-chart';
import { Pagination } from '@/app/_components/shared/pagination';
import { getStudents } from '@/actions/admin/getStudents';
import { getAdminExams } from '@/actions/admin/getExams';
import { getAdminQuestions } from '@/actions/admin/getQuestions';
import { getCompletedExams } from '@/actions/student/getCompletedExams';
import { queryKeys } from '@/app/_lib/query-keys';
import { getGrade, getInitials, formatDate } from '@/app/_lib/utils';
import type { StudentSummary, Exam, ExamSubmission } from '@/app/_lib/types';

export function AdminHomeTab() {
  const [studentPage, setStudentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pPage, setPPage] = useState(1);
  const [cPage, setCPage] = useState(1);
  const [tf, setTf] = useState<'monthly' | 'yearly'>('monthly');

  const { data: studentsData } = useQuery({
    queryKey: queryKeys.adminStudents(studentPage, search),
    queryFn: () => getStudents(studentPage, search),
  });
  const { data: examsData } = useQuery({
    queryKey: queryKeys.adminExams(1),
    queryFn: () => getAdminExams(1),
  });
  const { data: questionsData } = useQuery({
    queryKey: queryKeys.adminQuestions(1),
    queryFn: () => getAdminQuestions(1),
  });

  const students = studentsData?.students ?? [];
  const selectedStudent = selectedId ? students.find(s => s.id === selectedId) ?? students[0] : students[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>Overview</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Click a student row to see their details and performance.</div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <StatTile icon={Users}    iconColor="var(--accent)" label="Total Students"  value={studentsData?.total ?? 0}  trend="registered" />
        <StatTile icon={FileText} iconColor="var(--cyan)"   label="Active Exams"   value={examsData?.exams.filter(e => e.status === 'published').length ?? 0} trend="published" />
        <StatTile icon={Database} iconColor="var(--green)"  label="Questions"      value={questionsData?.total ?? 0} trend="in bank" />
        <StatTile icon={BarChart2}iconColor="var(--amber)"  label="Avg Score"      value="—" trend="platform-wide" />
      </div>

      {/* Students list */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Users size={15} /> Students
            <span className="pill pill-soft" style={{ marginLeft: 6 }}>{studentsData?.total ?? 0}</span>
          </div>
          <input className="input" placeholder="Search students…" style={{ width: 220 }} value={search}
            onChange={e => { setSearch(e.target.value); setStudentPage(1); }} />
        </div>
        <div className="list">
          {students.map(s => {
            const { color } = getGrade(s.avgScore);
            return (
              <button key={s.id} className="list-row" style={{
                cursor: 'pointer', width: '100%', textAlign: 'left',
                background: selectedStudent?.id === s.id ? 'var(--panel-2)' : 'transparent',
                borderRadius: 8, padding: '10px 8px',
              }} onClick={() => setSelectedId(s.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar">{getInitials(s.name)}</div>
                  <div>
                    <div className="list-name">{s.name}</div>
                    <div className="list-meta">
                      <span>{s.grade ?? '—'}</span>
                      <span style={{ color: 'var(--text-dim)' }}>·</span>
                      <span>{s.school ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className={`pill ${s.status === 'active' ? 'pill-green' : 'pill-amber'}`}>{s.status}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color, fontFeatureSettings: '"tnum"' }}>{s.avgScore}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>avg</div>
                  </div>
                  <ChevronRight size={14} color="var(--text-dim)" />
                </div>
              </button>
            );
          })}
        </div>
        <Pagination page={studentPage} total={studentsData?.pages ?? 1} onPage={setStudentPage} />
      </div>

      {selectedStudent && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', fontSize: 13, color: 'var(--text-muted)' }}>
            <Users size={14} color="var(--accent)" />
            Showing data for <strong style={{ color: 'var(--text)', marginLeft: 4 }}>{selectedStudent.name}</strong>
            {selectedStudent.grade ? ` · ${selectedStudent.grade}` : ''}
          </div>

          {/* Results graph */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div className="card-title" style={{ margin: 0 }}>
                <BarChart2 size={15} /> Results — {selectedStudent.name.split(' ')[0]}
              </div>
              <div className="seg">
                <button className={`seg-btn ${tf === 'monthly' ? 'active' : ''}`} onClick={() => setTf('monthly')}>Monthly</button>
                <button className={`seg-btn ${tf === 'yearly' ? 'active' : ''}`} onClick={() => setTf('yearly')}>Yearly</button>
              </div>
            </div>
            <PerformanceChart subjectSlug="math" subjectColor="var(--accent)" />
          </div>
        </>
      )}
    </div>
  );
}
