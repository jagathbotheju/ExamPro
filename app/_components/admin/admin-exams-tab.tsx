'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Trash2, UserPlus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubjectBlock } from '@/app/_components/shared/subject-block';
import { Pagination } from '@/app/_components/shared/pagination';
import { getAdminExams } from '@/actions/admin/getExams';
import { createExam } from '@/actions/admin/createExam';
import { deleteExam } from '@/actions/admin/deleteExam';
import { assignExam } from '@/actions/admin/assignExam';
import { getStudents } from '@/actions/admin/getStudents';
import { loadQuestionsFromBank } from '@/actions/admin/loadQuestionsFromBank';
import { getQuestionPool } from '@/actions/admin/getQuestionPool';
import { getExamAssignedStudentIds } from '@/actions/admin/getExamAssignedStudentIds';
import { stripHtml } from '@/app/_components/shared/rich-text-editor';
import type { PoolQuestion } from '@/actions/admin/getQuestionPool';
import { getSubjects, getGrades } from '@/actions/admin/manageSubjectsGrades';
import { getExamDetail } from '@/actions/admin/getExamDetail';
import { queryKeys } from '@/app/_lib/query-keys';
import { formatDate } from '@/app/_lib/utils';
import type { Exam, Subject, Grade } from '@/app/_lib/types';

export function AdminExamsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<Exam | null>(null);
  const [viewExam, setViewExam] = useState<Exam | null>(null);

  const { data } = useQuery({
    queryKey: queryKeys.adminExams(page, gradeFilter, subjectFilter),
    queryFn: () => getAdminExams(page, gradeFilter || undefined, subjectFilter || undefined),
  });
  const { data: subjectsRaw = [] } = useQuery({ queryKey: queryKeys.subjects(), queryFn: getSubjects });
  const { data: gradesRaw = [] } = useQuery({ queryKey: queryKeys.grades(), queryFn: getGrades });

  const deleteMut = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'exams'] }); toast.success('Exam deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const subjects = subjectsRaw as Subject[];
  const grades = gradesRaw as Grade[];
  const exams = data?.exams ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>Exams</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Create, assign, and manage exams.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Create New Exam
        </button>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: 16 }}>
        <span className="label-tiny">Filter</span>
        <select className="select" value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setPage(1); }}>
          <option value="">All Grades</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
        <select className="select" value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPage(1); }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{data?.total ?? 0} exams</div>
      </div>

      <div className="card">
        <div className="list">
          {exams.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No exams found.</div>
          ) : exams.map(exam => (
            <div key={exam.id} className="list-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <SubjectBlock subject={exam.subject} />
                <div>
                  <div className="list-name">
                    {exam.name}
                    {exam.status === 'draft' && <span className="pill pill-amber" style={{ marginLeft: 8 }}>DRAFT</span>}
                    {exam.status === 'archived' && <span className="pill pill-soft" style={{ marginLeft: 8 }}>ARCHIVED</span>}
                  </div>
                  <div className="list-meta">
                    {exam.subject && <span style={{ color: exam.subject.color }}>{exam.subject.name}</span>}
                    {exam.subject && <span style={{ color: 'var(--text-dim)' }}>·</span>}
                    {exam.grade && <span>{exam.grade.label}</span>}
                    {exam.grade && <span style={{ color: 'var(--text-dim)' }}>·</span>}
                    <span>{formatDate(exam.publishedAt)}</span>
                    <span style={{ color: 'var(--text-dim)' }}>·</span>
                    <span>{exam.questionCount ?? 0} Qs</span>
                    {(exam.assignedCount ?? 0) > 0 && (
                      <><span style={{ color: 'var(--text-dim)' }}>·</span><span>{exam.assignedCount} assigned</span></>
                    )}
                  </div>
                </div>
              </div>
              <div className="list-actions">
                <button className="btn btn-soft btn-sm" onClick={() => setAssignFor(exam)}>
                  <UserPlus size={12} /> Assign
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewExam(exam)}>
                  <Eye size={12} /> View
                </button>
                <button className="icon-btn" onClick={() => { if (confirm(`Delete "${exam.name}"?`)) deleteMut.mutate(exam.id); }}>
                  <Trash2 size={14} color="var(--red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} total={data?.pages ?? 1} onPage={setPage} />
      </div>

      {createOpen && (
        <CreateExamDialog
          subjects={subjects} grades={grades}
          onClose={() => setCreateOpen(false)}
          onCreate={() => { setCreateOpen(false); qc.invalidateQueries({ queryKey: ['admin', 'exams'] }); toast.success('Exam created'); }}
        />
      )}
      {assignFor && (
        <AssignExamDialog
          exam={assignFor} onClose={() => setAssignFor(null)}
          onAssigned={() => { setAssignFor(null); toast.success('Exam assigned'); }}
        />
      )}
      {viewExam && (
        <ExamDetailDialog exam={viewExam} onClose={() => setViewExam(null)} />
      )}
    </div>
  );
}

function CreateExamDialog({ subjects, grades, onClose, onCreate }: {
  subjects: Subject[]; grades: Grade[];
  onClose: () => void; onCreate: () => void;
}) {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [gradeId, setGradeId] = useState(grades[0]?.id ?? '');
  const [duration, setDuration] = useState(30);
  const [qCount, setQCount] = useState(10);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newOnly, setNewOnly] = useState(false);

  const { data: poolData } = useQuery({
    queryKey: ['bank-pool', subjectId, gradeId],
    queryFn: () => getQuestionPool(subjectId, gradeId),
    enabled: !!(subjectId && gradeId),
  });
  const pool: PoolQuestion[] = poolData ?? [];
  const visiblePool = newOnly ? pool.filter(q => q.tier === 'unused') : pool;

  const toggle = (id: string) => setPicked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleLoad = async () => {
    setLoading(true);
    try {
      const qs = await loadQuestionsFromBank(subjectId, gradeId, qCount);
      setPicked(new Set(qs.map(q => q.id)));
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!name || picked.size === 0) return;
    setSaving(true);
    try {
      await createExam({ name, subjectId, gradeId, durationMinutes: duration, questionIds: [...picked] });
      onCreate();
    } catch { toast.error('Failed to create exam'); setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Create New Exam</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Build an exam from the question bank.</div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="label-tiny" style={{ marginBottom: 6 }}>Exam Name</div>
          <input className="input" placeholder="e.g. Term 2 Midterm — Algebra" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="grid-4" style={{ marginBottom: 14 }}>
          <div>
            <div className="label-tiny" style={{ marginBottom: 6 }}>Subject</div>
            <select className="select" style={{ width: '100%' }} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="label-tiny" style={{ marginBottom: 6 }}>Grade</div>
            <select className="select" style={{ width: '100%' }} value={gradeId} onChange={e => setGradeId(e.target.value)}>
              {grades.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <div className="label-tiny" style={{ marginBottom: 6 }}>Duration (min)</div>
            <input type="number" min={1} className="input" value={duration} onChange={e => setDuration(Math.max(1, +e.target.value))} />
          </div>
          <div>
            <div className="label-tiny" style={{ marginBottom: 6 }}>Total</div>
            <input type="number" min={1} className="input" value={qCount} onChange={e => setQCount(Math.max(1, +e.target.value))} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="label-tiny">Pick Questions</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: picked.size > 0 ? 'var(--accent-soft)' : 'var(--panel-2)',
              border: `1px solid ${picked.size > 0 ? 'var(--accent)' : 'var(--border-soft)'}`,
              borderRadius: 6, padding: '2px 8px',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: picked.size > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                SELECTED
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: picked.size > 0 ? 'var(--accent)' : 'var(--text-muted)', fontFeatureSettings: '"tnum"' }}>
                {picked.size}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>/ {qCount}</span>
            </div>
          </div>
          <button className="btn btn-soft btn-sm" onClick={handleLoad} disabled={loading}>
            <Wand2 size={12} /> {loading ? 'Loading…' : 'Load from Bank'}
          </button>
        </div>

        {/* Select All + New Only row */}
        {pool.length > 0 && (() => {
          const allSelected = visiblePool.length > 0 && visiblePool.every(q => picked.has(q.id));
          const someSelected = visiblePool.some(q => picked.has(q.id)) && !allSelected;
          const newCount = pool.filter(q => q.tier === 'unused').length;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <label style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 10px',
                background: 'var(--panel-2)', borderRadius: 8,
                cursor: 'pointer', userSelect: 'none',
                border: '1px solid var(--border-soft)',
              }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={() => setPicked(allSelected ? new Set() : new Set(visiblePool.map(q => q.id)))}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 2 }}>
                  ({visiblePool.length} question{visiblePool.length !== 1 ? 's' : ''})
                </span>
              </label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px',
                background: newOnly ? 'rgba(45,212,191,0.08)' : 'var(--panel-2)', borderRadius: 8,
                cursor: 'pointer', userSelect: 'none',
                border: `1px solid ${newOnly ? 'var(--green)' : 'var(--border-soft)'}`,
                whiteSpace: 'nowrap',
              }}>
                <input
                  type="checkbox"
                  checked={newOnly}
                  onChange={e => setNewOnly(e.target.checked)}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: newOnly ? 'var(--green)' : 'var(--text-muted)' }}>New only</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>({newCount})</span>
              </label>
            </div>
          );
        })()}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {([
            { tier: 'unused',    label: 'New',       color: 'var(--green)'  },
            { tier: 'incorrect', label: 'Needs Review', color: 'var(--amber)' },
            { tier: 'other',     label: 'Used',      color: 'var(--text-dim)' },
          ] as const).map(({ tier, label, color }) => (
            <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border-soft)', borderRadius: 10, padding: 8, marginBottom: 14 }}>
          {visiblePool.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {pool.length === 0 ? 'No questions in bank for this subject + grade.' : 'No new questions available.'}
            </div>
          ) : visiblePool.map(q => {
            const tierColor = q.tier === 'unused' ? 'var(--green)' : q.tier === 'incorrect' ? 'var(--amber)' : 'var(--text-dim)';
            const tierLabel = q.tier === 'unused' ? 'New' : q.tier === 'incorrect' ? 'Needs Review' : 'Used';
            return (
              <label key={q.id} style={{ display: 'flex', gap: 12, padding: '9px 8px', borderRadius: 8, cursor: 'pointer', background: picked.has(q.id) ? 'var(--accent-soft)' : 'transparent', alignItems: 'flex-start' }}>
                <input type="checkbox" checked={picked.has(q.id)} onChange={() => toggle(q.id)} style={{ marginTop: 3, flexShrink: 0 }} />
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: tierColor, flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{stripHtml(q.body)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 6 }}>
                    <span style={{ color: tierColor, fontWeight: 600 }}>{tierLabel}</span>
                    <span style={{ color: 'var(--text-dim)' }}>·</span>
                    <span>{q.difficulty}</span>
                    <span style={{ color: 'var(--text-dim)' }}>·</span>
                    <span>used {q.usesCount}×</span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!name || picked.size === 0 || saving} onClick={handleCreate}>
            {saving ? 'Creating…' : 'Create Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignExamDialog({ exam, onClose, onAssigned }: { exam: Exam; onClose: () => void; onAssigned: () => void }) {
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-students-all'],
    queryFn: () => getStudents(1, ''),
  });

  const { data: assignedIds } = useQuery({
    queryKey: ['exam-assigned-students', exam.id],
    queryFn: () => getExamAssignedStudentIds(exam.id),
  });
  const alreadyAssigned = new Set(assignedIds ?? []);

  const students = data?.students ?? [];
  const filtered = search ? students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())) : students;

  const toggle = (id: string) => {
    if (alreadyAssigned.has(id)) return;
    setPicked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleAssign = async () => {
    if (picked.size === 0) return;
    setSaving(true);
    try { await assignExam(exam.id, [...picked]); onAssigned(); }
    catch { toast.error('Failed to assign'); setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Assign Exam</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exam.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="input" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPicked(new Set(filtered.filter(s => !alreadyAssigned.has(s.id)).map(s => s.id)))}
          >All</button>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-soft)', borderRadius: 10 }}>
          {filtered.map(s => {
            const disabled = alreadyAssigned.has(s.id);
            return (
              <label
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  borderBottom: '1px solid var(--border-soft)',
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.45 : 1,
                  background: disabled ? 'transparent' : picked.has(s.id) ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                <input type="checkbox" checked={picked.has(s.id)} disabled={disabled} onChange={() => toggle(s.id)} />
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{getInitials(s.name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.grade} · {s.school}</div>
                </div>
                {disabled && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Assigned</span>
                )}
              </label>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{picked.size} selected</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={picked.size === 0 || saving} onClick={handleAssign}>
              {saving ? 'Assigning…' : `Assign to ${picked.size}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('');
}

const DIFF_COLORS: Record<string, string> = {
  Easy: 'var(--green)',
  Medium: 'var(--amber)',
  Hard: 'var(--red)',
};

function ExamDetailDialog({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['exam-detail', exam.id],
    queryFn: () => getExamDetail(exam.id),
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <SubjectBlock subject={exam.subject} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {exam.name}
                {exam.status === 'draft' && <span className="pill pill-amber">DRAFT</span>}
                {exam.status === 'archived' && <span className="pill pill-soft">ARCHIVED</span>}
              </div>
              <div className="list-meta" style={{ marginTop: 4 }}>
                {exam.subject && <span style={{ color: exam.subject.color }}>{exam.subject.name}</span>}
                {exam.subject && <span style={{ color: 'var(--text-dim)' }}>·</span>}
                {exam.grade && <span>{exam.grade.label}</span>}
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span>{exam.durationMinutes} min</span>
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span>{exam.questionCount ?? 0} questions</span>
                {(data?.assignedCount ?? 0) > 0 && (
                  <><span style={{ color: 'var(--text-dim)' }}>·</span><span>{data!.assignedCount} assigned</span></>
                )}
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading questions…</div>
          ) : data?.questions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No questions attached to this exam.</div>
          ) : data?.questions.map((q, i) => (
            <div key={q.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', minWidth: 24, paddingTop: 1 }}>Q{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div
                    className="rich-text-display"
                    style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, marginBottom: 4 }}
                    dangerouslySetInnerHTML={{ __html: q.body }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, color: DIFF_COLORS[q.difficulty] ?? 'var(--text-muted)' }}>{q.difficulty}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>·</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>used {q.usesCount}×</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 34 }}>
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctIndex;
                  return (
                    <div key={oi} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 12px', borderRadius: 8,
                      background: isCorrect ? 'rgba(45,212,191,0.10)' : 'var(--panel-2)',
                      border: `1px solid ${isCorrect ? 'var(--green)' : 'var(--border-soft)'}`,
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, width: 20, height: 20,
                        borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isCorrect ? 'var(--green)' : 'var(--panel)',
                        color: isCorrect ? '#0a1220' : 'var(--text-muted)',
                        flexShrink: 0,
                      }}>{String.fromCharCode(65 + oi)}</span>
                      <span style={{ fontSize: 13, color: isCorrect ? 'var(--green)' : 'var(--text)' }}>{opt}</span>
                      {isCorrect && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--green)' }}>Correct</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 16, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
