'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubjectBlock } from '@/app/_components/shared/subject-block';
import { Pagination } from '@/app/_components/shared/pagination';
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/app/_components/ui/select';
import { getAdminQuestions } from '@/actions/admin/getQuestions';
import { createQuestion, updateQuestion, deleteQuestion } from '@/actions/admin/manageQuestion';
import { getSubjects, getGrades } from '@/actions/admin/manageSubjectsGrades';
import { queryKeys } from '@/app/_lib/query-keys';
import type { Question, Subject, Grade, Difficulty } from '@/app/_lib/types';

const DIFF_COLORS: Record<Difficulty, string> = {
  Easy: 'var(--green)',
  Medium: 'var(--amber)',
  Hard: 'var(--red)',
};

let _lastSubjectId = '';
let _lastGradeId = '';

export function AdminQuestionsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);

  const { data } = useQuery({
    queryKey: queryKeys.adminQuestions(page, gradeFilter, subjectFilter, search),
    queryFn: () => getAdminQuestions(page, gradeFilter || undefined, subjectFilter || undefined, search),
  });
  const { data: subjectsRaw = [] } = useQuery({ queryKey: queryKeys.subjects(), queryFn: getSubjects });
  const { data: gradesRaw = [] } = useQuery({ queryKey: queryKeys.grades(), queryFn: getGrades });

  const subjects = subjectsRaw as Subject[];
  const grades = gradesRaw as Grade[];
  const questions = data?.questions ?? [];

  const deleteMut = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'questions'] }); toast.success('Question deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const onSaved = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
    setCreateOpen(false);
    setEditQ(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>Questions Bank</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Manage the question pool used to build exams.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Add Question
        </button>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: 16 }}>
        <span className="label-tiny">Filter</span>
        <Select value={gradeFilter} onValueChange={val => { setGradeFilter(val ?? ''); setPage(1); }}>
          <SelectTrigger className="min-w-[148px] bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] text-[13px] h-[37px] rounded-[10px]">
            <span className="flex-1 text-left truncate">
              {gradeFilter ? (grades.find(g => g.id === gradeFilter)?.label ?? 'All Grades') : 'All Grades'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Grades</SelectItem>
            {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={val => { setSubjectFilter(val ?? ''); setPage(1); }}>
          <SelectTrigger className="min-w-[148px] bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] text-[13px] h-[37px] rounded-[10px]">
            <span className="flex-1 text-left truncate">
              {subjectFilter ? (subjects.find(s => s.id === subjectFilter)?.name ?? 'All Subjects') : 'All Subjects'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <input
          className="input" placeholder="Search questions…" value={search}
          style={{ flex: 1, minWidth: 180 }}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{data?.total ?? 0} questions</div>
      </div>

      <div className="card">
        <div className="list">
          {questions.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No questions found.</div>
          ) : questions.map(q => (
            <div key={q.id} className="list-row">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                {q.subject && <SubjectBlock subject={q.subject} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-name" style={{ whiteSpace: 'normal', lineHeight: 1.45 }}>{q.body}</div>
                  <div className="list-meta" style={{ marginTop: 4 }}>
                    {q.subject && <span style={{ color: q.subject.color }}>{q.subject.name}</span>}
                    {q.subject && <span style={{ color: 'var(--text-dim)' }}>·</span>}
                    {q.grade && <span>{q.grade.label}</span>}
                    {q.grade && <span style={{ color: 'var(--text-dim)' }}>·</span>}
                    <span style={{ color: DIFF_COLORS[q.difficulty] }}>{q.difficulty}</span>
                    <span style={{ color: 'var(--text-dim)' }}>·</span>
                    <span>used {q.usesCount}×</span>
                  </div>
                </div>
              </div>
              <div className="list-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditQ(q)}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="icon-btn" onClick={() => { if (confirm('Delete this question?')) deleteMut.mutate(q.id); }}>
                  <Trash2 size={14} color="var(--red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} total={data?.pages ?? 1} onPage={setPage} />
      </div>

      {(createOpen || editQ) && (
        <QuestionDialog
          subjects={subjects} grades={grades}
          question={editQ ?? undefined}
          onClose={() => { setCreateOpen(false); setEditQ(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

function QuestionDialog({ subjects, grades, question, onClose, onSaved }: {
  subjects: Subject[]; grades: Grade[];
  question?: Question;
  onClose: () => void; onSaved: () => void;
}) {
  const editing = !!question;
  const [body, setBody] = useState(question?.body ?? '');
  const [opts, setOpts] = useState<string[]>(question?.options ?? ['', '', '', '']);
  const [correct, setCorrect] = useState(question?.correctIndex ?? 0);
  const [subjectId, setSubjectId] = useState(question?.subjectId ?? (_lastSubjectId || (subjects[0]?.id ?? '')));
  const [gradeId, setGradeId] = useState(question?.gradeId ?? (_lastGradeId || (grades[0]?.id ?? '')));
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? 'Medium');
  const [saving, setSaving] = useState(false);

  const setOpt = (i: number, v: string) => setOpts(o => { const n = [...o]; n[i] = v; return n; });

  const handleSave = async () => {
    if (!body.trim() || opts.some(o => !o.trim())) return;
    setSaving(true);
    try {
      _lastSubjectId = subjectId;
      _lastGradeId = gradeId;
      const payload = { body: body.trim(), options: opts.map(o => o.trim()), correctIndex: correct, subjectId, gradeId, difficulty };
      if (editing && question) {
        await updateQuestion(question.id, payload);
        toast.success('Question updated');
      } else {
        await createQuestion(payload);
        toast.success('Question added');
      }
      onSaved();
    } catch { toast.error('Failed to save'); setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{editing ? 'Edit Question' : 'Add Question'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fill in the question body, options, and metadata.</div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="label-tiny" style={{ marginBottom: 6 }}>Question Body</div>
          <textarea
            className="input" rows={3}
            style={{ resize: 'vertical', width: '100%' }}
            placeholder="Enter the question text…"
            value={body} onChange={e => setBody(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="label-tiny" style={{ marginBottom: 8 }}>Answer Options (select the correct one)</div>
          {opts.map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 20 }}>{String.fromCharCode(65 + i)}.</span>
              <input
                className="input" style={{ flex: 1 }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={opt} onChange={e => setOpt(i, e.target.value)}
              />
              {correct === i && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Correct</span>}
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 18 }}>
          <div>
            <div className="label-tiny" style={{ marginBottom: 6 }}>Subject</div>
            <Select value={subjectId} onValueChange={val => setSubjectId(val ?? '')}>
              <SelectTrigger className="w-full bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] text-[13px] h-[37px] rounded-[10px]">
                <span className="flex-1 text-left truncate">
                  {subjects.find(s => s.id === subjectId)?.name ?? 'Select subject'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="label-tiny" style={{ marginBottom: 6 }}>Grade</div>
            <Select value={gradeId} onValueChange={val => setGradeId(val ?? '')}>
              <SelectTrigger className="w-full bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] text-[13px] h-[37px] rounded-[10px]">
                <span className="flex-1 text-left truncate">
                  {grades.find(g => g.id === gradeId)?.label ?? 'Select grade'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div className="label-tiny" style={{ marginBottom: 6 }}>Difficulty</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  className={`btn btn-sm ${difficulty === d ? 'btn-soft' : 'btn-ghost'}`}
                  style={{ flex: 1, color: difficulty === d ? DIFF_COLORS[d] : undefined }}
                  onClick={() => setDifficulty(d)}
                >{d}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!body.trim() || opts.some(o => !o.trim()) || saving}
            onClick={handleSave}
          >{saving ? 'Saving…' : editing ? 'Update Question' : 'Add Question'}</button>
        </div>
      </div>
    </div>
  );
}
