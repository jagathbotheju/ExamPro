'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, FileText, Database, BarChart2, ChevronRight, BookOpen, Clock, Trash2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/app/_components/ui/toggle-group';
import { StatTile } from '@/app/_components/shared/stat-tile';
import { SubjectBlock } from '@/app/_components/shared/subject-block';
import { PerformanceChart } from '@/app/_components/shared/performance-chart';
import { Pagination } from '@/app/_components/shared/pagination';
import { getStudents } from '@/actions/admin/getStudents';
import { getAdminExams } from '@/actions/admin/getExams';
import { getAdminQuestions } from '@/actions/admin/getQuestions';
import { getStudentPendingExams, getStudentCompletedExams } from '@/actions/admin/getStudentDetail';
import { deleteAssignment } from '@/actions/admin/deleteAssignment';
import { deleteSubmission } from '@/actions/admin/deleteSubmission';
import { getStudentAllSubjectsPerformanceData } from '@/actions/admin/getStudentAllSubjectsPerformanceData';
import { getStudentPerformanceYears } from '@/actions/admin/getStudentPerformanceYears';
import { getSubjects } from '@/actions/admin/manageSubjectsGrades';
import { queryKeys } from '@/app/_lib/query-keys';
import { getGrade, getInitials, formatDate } from '@/app/_lib/utils';
import type { StudentSummary } from '@/app/_lib/types';

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function AdminHomeTab() {
  const qc = useQueryClient();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [studentPage, setStudentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pPage, setPPage] = useState(1);
  const [cPage, setCPage] = useState(1);
  const [tf, setTf] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

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
  const { data: subjectsData } = useQuery({
    queryKey: queryKeys.subjects(),
    queryFn: getSubjects,
  });

  const students = studentsData?.students ?? [];
  const selectedStudent = selectedId
    ? students.find(s => s.id === selectedId) ?? null
    : null;

  const activeStudentId = selectedStudent?.id ?? '';

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: queryKeys.adminStudentPendingExams(activeStudentId, pPage),
    queryFn: () => getStudentPendingExams(activeStudentId, pPage),
    enabled: !!activeStudentId,
  });

  const { data: completedData, isLoading: completedLoading } = useQuery({
    queryKey: queryKeys.adminStudentCompletedExams(activeStudentId, cPage),
    queryFn: () => getStudentCompletedExams(activeStudentId, cPage),
    enabled: !!activeStudentId,
  });

  const { data: availableYears = [] } = useQuery({
    queryKey: queryKeys.adminStudentPerformanceYears(activeStudentId),
    queryFn: () => getStudentPerformanceYears(activeStudentId),
    enabled: !!activeStudentId,
  });

  // Ensure selectedYear is a valid available year once data loads
  const yearOptions = availableYears.length > 0 ? availableYears : [currentYear];
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  const { data: chartData = [] } = useQuery({
    queryKey: queryKeys.adminStudentAllPerformance(activeStudentId, tf, selectedYear, tf === 'monthly' ? selectedMonth : undefined),
    queryFn: () => getStudentAllSubjectsPerformanceData(activeStudentId, tf, selectedYear, tf === 'monthly' ? selectedMonth : 0),
    enabled: !!activeStudentId,
  });

  const subjects = subjectsData ?? [];

  const deletePendingMut = useMutation({
    mutationFn: ({ examId }: { examId: string }) => deleteAssignment(activeStudentId, examId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'student', activeStudentId, 'pending'] }),
  });

  const deleteCompletedMut = useMutation({
    mutationFn: ({ submissionId }: { submissionId: string }) => deleteSubmission(submissionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'student', activeStudentId, 'completed'] }),
  });

  function handleSelectStudent(s: StudentSummary) {
    setSelectedId(s.id);
    setPPage(1);
    setCPage(1);
    // Reset chart filters when selecting a new student
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setTf('monthly');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>Overview</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Click a student row to see their details and performance.</div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <StatTile icon={Users} iconColor="var(--accent)" label="Total Students" value={studentsData?.total ?? 0} trend="registered" />
        <StatTile icon={FileText} iconColor="var(--cyan)" label="Active Exams" value={examsData?.exams.filter(e => e.status === 'published').length ?? 0} trend="published" />
        <StatTile icon={Database} iconColor="var(--green)" label="Questions" value={questionsData?.total ?? 0} trend="in bank" />
        <StatTile icon={BarChart2} iconColor="var(--amber)" label="Avg Score" value={selectedStudent ? `${selectedStudent.avgScore}%` : '—'} trend={selectedStudent ? selectedStudent.name.split(' ')[0] : 'platform-wide'} />
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
            const isSelected = selectedStudent?.id === s.id;
            return (
              <button key={s.id} className="list-row" style={{
                cursor: 'pointer', width: '100%', textAlign: 'left',
                background: isSelected ? 'var(--panel-2)' : 'transparent',
                borderRadius: 8, padding: '10px 8px',
                border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                transition: 'background 0.15s, border-color 0.15s',
              }} onClick={() => handleSelectStudent(s)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="avatar" style={{
                    outline: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    outlineOffset: 2,
                    transition: 'outline-color 0.15s',
                  }}>{getInitials(s.name)}</div>
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
                  <ChevronRight size={14} color={isSelected ? 'var(--accent)' : 'var(--text-dim)'} />
                </div>
              </button>
            );
          })}
        </div>
        <Pagination page={studentPage} total={studentsData?.pages ?? 1} onPage={setStudentPage} />
      </div>

      {selectedStudent && (
        <>
          {/* Selected student label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            fontSize: 13, color: 'var(--text-muted)',
            background: 'var(--accent-soft)', borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            <Users size={14} color="var(--accent)" />
            Showing data for
            <strong style={{ color: 'var(--text)', marginLeft: 2 }}>{selectedStudent.name}</strong>
            {selectedStudent.grade ? (
              <span style={{ color: 'var(--text-dim)' }}>· {selectedStudent.grade}</span>
            ) : null}
          </div>

          {/* Pending exams for student */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              <Clock size={15} color="var(--cyan)" /> Pending Exams
              {pendingData && (
                <span className="pill pill-soft" style={{ marginLeft: 6 }}>{pendingData.total}</span>
              )}
            </div>
            {pendingLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : !pendingData?.exams.length ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No pending exams</div>
            ) : (
              <div className="list">
                {pendingData.exams.map(exam => (
                  <div key={exam.id} className="list-row" style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {exam.subject ? (
                        <SubjectBlock subject={exam.subject} size={36} />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'var(--panel-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <BookOpen size={16} color="var(--text-dim)" />
                        </div>
                      )}
                      <div>
                        <div className="list-name">{exam.name}</div>
                        <div className="list-meta">
                          <span>{exam.subject?.name ?? 'Unknown'}</span>
                          <span style={{ color: 'var(--text-dim)' }}>·</span>
                          <span>{exam.grade?.label ?? '—'}</span>
                          <span style={{ color: 'var(--text-dim)' }}>·</span>
                          <span>{exam.questionCount ?? 0} Qs</span>
                          <span style={{ color: 'var(--text-dim)' }}>·</span>
                          <span>{exam.durationMinutes} min</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="pill pill-soft">Pending</span>
                      <button
                        className="icon-btn"
                        title="Remove assignment"
                        onClick={() => {
                          if (confirm('Remove this exam assignment from the student?'))
                            deletePendingMut.mutate({ examId: exam.id });
                        }}
                      >
                        <Trash2 size={13} color="var(--red)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingData && pendingData.pages > 1 && (
              <Pagination page={pPage} total={pendingData.pages} onPage={setPPage} />
            )}
          </div>

          {/* Completed exams for student */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              <FileText size={15} color="var(--green)" /> Completed Exams
              {completedData && (
                <span className="pill pill-soft" style={{ marginLeft: 6 }}>{completedData.total}</span>
              )}
            </div>
            {completedLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
            ) : !completedData?.submissions.length ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No completed exams</div>
            ) : (
              <div className="list">
                {completedData.submissions.map(sub => {
                  const { color } = getGrade(sub.score);
                  return (
                    <div key={sub.id} className="list-row" style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {sub.exam?.subject ? (
                          <SubjectBlock subject={sub.exam.subject} size={36} />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--panel-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <BookOpen size={16} color="var(--text-dim)" />
                          </div>
                        )}
                        <div>
                          <div className="list-name">{sub.exam?.name ?? 'Exam'}</div>
                          <div className="list-meta">
                            <span>{sub.exam?.subject?.name ?? '—'}</span>
                            <span style={{ color: 'var(--text-dim)' }}>·</span>
                            <span>{sub.correctCount}/{sub.totalQuestions} correct</span>
                            <span style={{ color: 'var(--text-dim)' }}>·</span>
                            <span>{formatDate(sub.submittedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 700, color,
                          fontFeatureSettings: '"tnum"',
                          minWidth: 52, textAlign: 'right',
                        }}>
                          {sub.score}%
                        </div>
                        <button
                          className="icon-btn"
                          title="Delete submission"
                          onClick={() => {
                            if (confirm('Delete this exam submission? This cannot be undone.'))
                              deleteCompletedMut.mutate({ submissionId: sub.id });
                          }}
                        >
                          <Trash2 size={13} color="var(--red)" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {completedData && completedData.pages > 1 && (
              <Pagination page={cPage} total={completedData.pages} onPage={setCPage} />
            )}
          </div>

          {/* Results chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-[18px] flex-wrap gap-[10px]">
              <div className="card-title m-0">
                <BarChart2 size={15} /> Results — {selectedStudent.name.split(' ')[0]}
              </div>
              <div className="flex flex-row items-center gap-[10px]  p-2">
                {/* Monthly / Yearly toggle */}
                <ToggleGroup
                  variant='outline'
                  value={[tf]}
                  onValueChange={(vals) => vals.length > 0 && setTf(vals[0] as 'monthly' | 'yearly')}
                  className='border-primary border'
                >
                  <ToggleGroupItem value="monthly" className={tf === 'monthly' ? 'bg-primary!' : ''}>Month</ToggleGroupItem>
                  <ToggleGroupItem value="yearly" className={tf === 'yearly' ? 'bg-primary!' : ''}>Year</ToggleGroupItem>
                </ToggleGroup>

                {/* Month selector — monthly mode only */}
                {tf === 'monthly' && (
                  <select
                    className="input h-8 text-xs px-[10px] min-w-[120px]"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                  >
                    {MONTHS_FULL.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                )}
                {/* Year selector */}
                <select
                  className="input h-8 text-xs px-[10px] min-w-[90px]"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

              </div>
            </div>
            <PerformanceChart multiData={chartData} allSubjects={subjects} />
          </div>
        </>
      )}
    </div>
  );
}
