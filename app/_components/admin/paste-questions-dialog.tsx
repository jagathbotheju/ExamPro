'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, ClipboardPaste, Trash2, Check, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { bulkCreateQuestions } from '@/actions/admin/bulkCreateQuestions';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/app/_components/ui/select';
import { SubjectBlock } from '@/app/_components/shared/subject-block';
import type { Subject, Grade, Difficulty } from '@/app/_lib/types';

interface EditableQuestion {
  body: string;
  options: [string, string, string, string];
  correctIndex: number;
  difficulty: Difficulty;
  expanded: boolean;
  error?: string;
}

interface Props {
  subjects: Subject[];
  grades: Grade[];
  onClose: () => void;
  onImported: () => void;
}

const DIFF_COLORS: Record<Difficulty, string> = {
  Easy: 'var(--green)',
  Medium: 'var(--amber)',
  Hard: 'var(--red)',
};

const EXAMPLE_JSON = `[
  {
    "question_body": "What is the capital of France?",
    "options": {
      "option_1": "London",
      "option_2": "Berlin",
      "option_3": "Paris",
      "option_4": "Rome"
    },
    "correct_index": 2
  },
  {
    "question_body": "Which planet is closest to the Sun?",
    "options": ["Venus", "Mercury", "Earth", "Mars"],
    "correct_index": 1
  }
]`;

function normaliseOptions(raw: unknown): [string, string, string, string] | null {
  if (Array.isArray(raw) && raw.length === 4 && raw.every(o => typeof o === 'string')) {
    return raw as [string, string, string, string];
  }
  if (typeof raw === 'object' && raw !== null) {
    const r = raw as Record<string, unknown>;
    const vals = ['option_1', 'option_2', 'option_3', 'option_4'].map(k => r[k]);
    if (vals.every(v => typeof v === 'string')) return vals as [string, string, string, string];
  }
  return null;
}

function parseJSON(text: string): { questions: EditableQuestion[]; errors: string[] } {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(text.trim());
  } catch (e) {
    return { questions: [], errors: [`Invalid JSON: ${(e as Error).message}`] };
  }

  const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  const questions: EditableQuestion[] = [];

  items.forEach((item, idx) => {
    const label = `Item ${idx + 1}`;
    if (typeof item !== 'object' || item === null) {
      errors.push(`${label}: not an object`);
      return;
    }
    const r = item as Record<string, unknown>;

    // body — support question_body, questionBody, body, question
    const body = (r.question_body ?? r.questionBody ?? r.body ?? r.question ?? '') as string;
    if (!body.trim()) { errors.push(`${label}: missing question body`); return; }

    // options
    const rawOpts = r.options ?? r.choices ?? r.answers;
    const opts = normaliseOptions(rawOpts);
    if (!opts) { errors.push(`${label}: "options" must be an array of 4 strings or an object with option_1…option_4`); return; }
    if (opts.some(o => !o.trim())) { errors.push(`${label}: all 4 options must be non-empty`); return; }

    // correct index — support correct_index, correctIndex, answer, correct
    const rawIdx = r.correct_index ?? r.correctIndex ?? r.answer ?? r.correct ?? 0;
    const ci = typeof rawIdx === 'number' ? rawIdx : parseInt(String(rawIdx), 10);
    if (isNaN(ci) || ci < 0 || ci > 3) { errors.push(`${label}: correct_index must be 0–3`); return; }

    // difficulty (optional)
    const rawDiff = (r.difficulty ?? 'Medium') as string;
    const diff: Difficulty = ['Easy', 'Medium', 'Hard'].includes(rawDiff) ? (rawDiff as Difficulty) : 'Medium';

    questions.push({ body: body.trim(), options: opts.map(o => o.trim()) as [string,string,string,string], correctIndex: ci, difficulty: diff, expanded: false });
  });

  return { questions, errors };
}

export function PasteQuestionsDialog({ subjects, grades, onClose, onImported }: Props) {
  const qc = useQueryClient();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [gradeId, setGradeId] = useState(grades[0]?.id ?? '');
  const [jsonText, setJsonText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [phase, setPhase] = useState<'paste' | 'preview'>('paste');
  const [showExample, setShowExample] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleParse = useCallback(() => {
    if (!jsonText.trim()) { toast.error('Paste some JSON first'); return; }
    const { questions: qs, errors } = parseJSON(jsonText);
    setParseErrors(errors);
    if (qs.length === 0 && errors.length > 0) { return; }
    if (qs.length === 0) { toast.error('No valid questions found'); return; }
    setQuestions(qs);
    setPhase('preview');
    if (errors.length > 0) toast.warning(`${qs.length} questions parsed, ${errors.length} skipped`);
    else toast.success(`${qs.length} question${qs.length !== 1 ? 's' : ''} ready to review`);
  }, [jsonText]);

  const updateBody = (i: number, v: string) =>
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, body: v } : q));
  const updateOption = (qi: number, oi: number, v: string) =>
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options] as [string,string,string,string];
      opts[oi] = v;
      return { ...q, options: opts };
    }));
  const setCorrect = (qi: number, ci: number) =>
    setQuestions(qs => qs.map((q, idx) => idx === qi ? { ...q, correctIndex: ci } : q));
  const setDifficulty = (qi: number, d: Difficulty) =>
    setQuestions(qs => qs.map((q, idx) => idx === qi ? { ...q, difficulty: d } : q));
  const toggleExpand = (i: number) =>
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, expanded: !q.expanded } : q));
  const removeQuestion = (i: number) =>
    setQuestions(qs => qs.filter((_, idx) => idx !== i));

  const canImport = questions.length > 0 && subjectId && gradeId &&
    questions.every(q => q.body.trim() && q.options.every(o => o.trim()));

  const handleImport = async () => {
    if (!canImport) return;
    setImporting(true);
    try {
      await bulkCreateQuestions(questions.map(q => ({
        body: q.body,
        options: q.options,
        correctIndex: q.correctIndex,
        difficulty: q.difficulty,
        subjectId,
        gradeId,
      })));
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      toast.success(`${questions.length} question${questions.length !== 1 ? 's' : ''} imported`);
      onImported();
    } catch {
      toast.error('Import failed');
      setImporting(false);
    }
  };

  const subject = subjects.find(s => s.id === subjectId);
  const grade = grades.find(g => g.id === gradeId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-lg"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 740, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexShrink: 0 }}>
          {phase === 'paste' ? (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardPaste size={18} color="var(--accent)" />
                Paste Questions as JSON
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                Paste an array of question objects and click Parse to review them.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {subject && <SubjectBlock subject={subject} />}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  Review &amp; Edit — {questions.length} Question{questions.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {subject?.name} · {grade?.label} · click any field to edit
                </div>
              </div>
            </div>
          )}
          <button className="icon-btn" onClick={onClose}><X size={14} /></button>
        </div>

        {/* ── PASTE PHASE ── */}
        {phase === 'paste' && (
          <>
            {/* Subject + Grade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div className="label-tiny" style={{ marginBottom: 6 }}>Assign to Subject</div>
                <Select value={subjectId} onValueChange={v => setSubjectId(v ?? '')}>
                  <SelectTrigger className="w-full bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] text-[13px] h-[37px] rounded-[10px]">
                    <span className="flex-1 text-left truncate">{subjects.find(s => s.id === subjectId)?.name ?? 'Select subject'}</span>
                  </SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <div className="label-tiny" style={{ marginBottom: 6 }}>Assign to Grade</div>
                <Select value={gradeId} onValueChange={v => setGradeId(v ?? '')}>
                  <SelectTrigger className="w-full bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] text-[13px] h-[37px] rounded-[10px]">
                    <span className="flex-1 text-left truncate">{grades.find(g => g.id === gradeId)?.label ?? 'Select grade'}</span>
                  </SelectTrigger>
                  <SelectContent>{grades.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Example toggle */}
            <button
              onClick={() => setShowExample(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)', marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {showExample ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showExample ? 'Hide' : 'Show'} JSON format example
            </button>

            {showExample && (
              <pre style={{
                background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 10,
                padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)', overflowX: 'auto',
                marginBottom: 10, lineHeight: 1.6,
              }}>
                {EXAMPLE_JSON}
              </pre>
            )}

            {/* Textarea */}
            <div className="label-tiny" style={{ marginBottom: 6 }}>JSON Input</div>
            <textarea
              className="input"
              rows={12}
              style={{ resize: 'vertical', width: '100%', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}
              placeholder={`Paste your JSON here…\n\nAccepted: array [ ] or single object { }\nOptions can be an array or { option_1, option_2, option_3, option_4 }`}
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setParseErrors([]); }}
              spellCheck={false}
            />

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {parseErrors.map((err, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--red)' }}>
                    <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                    {err}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!jsonText.trim() || !subjectId || !gradeId}
                onClick={handleParse}
                style={{ minWidth: 140 }}
              >
                <ClipboardPaste size={14} /> Parse Questions
              </button>
            </div>
          </>
        )}

        {/* ── PREVIEW PHASE ── */}
        {phase === 'preview' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
              {questions.map((q, qi) => (
                <div
                  key={qi}
                  style={{ padding: '14px 0', borderBottom: '1px solid var(--border-soft)' }}
                >
                  {/* Question number row */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', minWidth: 24, paddingTop: 9, flexShrink: 0 }}>
                      Q{qi + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      {/* Editable body */}
                      <textarea
                        className="input"
                        rows={2}
                        style={{ resize: 'vertical', width: '100%', fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}
                        value={q.body}
                        onChange={e => updateBody(qi, e.target.value)}
                      />

                      {/* Difficulty + expand toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                          <button
                            key={d}
                            onClick={() => setDifficulty(qi, d)}
                            style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, cursor: 'pointer',
                              background: q.difficulty === d ? `color-mix(in srgb, ${DIFF_COLORS[d]} 18%, transparent)` : 'transparent',
                              color: q.difficulty === d ? DIFF_COLORS[d] : 'var(--text-dim)',
                              border: `1px solid ${q.difficulty === d ? DIFF_COLORS[d] : 'var(--border)'}`,
                            }}
                          >{d}</button>
                        ))}
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 6 }}>
                          Correct: <strong style={{ color: 'var(--green)' }}>{String.fromCharCode(65 + q.correctIndex)}</strong>
                        </span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                          <button
                            className="icon-btn"
                            title={q.expanded ? 'Collapse' : 'Expand options'}
                            onClick={() => toggleExpand(qi)}
                          >
                            {q.expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                          <button className="icon-btn" title="Remove question" onClick={() => removeQuestion(qi)}>
                            <Trash2 size={13} color="var(--red)" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Options — always shown, expand reveals edit inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 34 }}>
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctIndex;
                      return (
                        <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {/* Letter chip — click to set correct */}
                          <button
                            onClick={() => setCorrect(qi, oi)}
                            title="Set as correct answer"
                            style={{
                              width: 24, height: 24, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
                              background: isCorrect ? 'var(--green)' : 'var(--panel)',
                              border: `1.5px solid ${isCorrect ? 'var(--green)' : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700,
                              color: isCorrect ? '#0a1220' : 'var(--text-muted)',
                            }}
                          >
                            {String.fromCharCode(65 + oi)}
                          </button>

                          {/* Option text — inline input when expanded, plain text otherwise */}
                          {q.expanded ? (
                            <input
                              className="input"
                              style={{ flex: 1, fontSize: 12 }}
                              value={opt}
                              onChange={e => updateOption(qi, oi, e.target.value)}
                            />
                          ) : (
                            <span style={{
                              flex: 1, fontSize: 13, padding: '6px 10px', borderRadius: 8,
                              background: isCorrect ? 'rgba(45,212,191,0.10)' : 'var(--panel-2)',
                              border: `1px solid ${isCorrect ? 'var(--green)' : 'var(--border-soft)'}`,
                              color: isCorrect ? 'var(--green)' : 'var(--text)',
                            }}>
                              {opt}
                            </span>
                          )}

                          {isCorrect && (
                            <Check size={13} color="var(--green)" style={{ flexShrink: 0 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  All questions removed.
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setPhase('paste')}>← Back</button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {questions.length} question{questions.length !== 1 ? 's' : ''} · click letter chip to change correct answer · expand to edit options
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button
                  className="btn btn-primary"
                  disabled={!canImport || importing}
                  onClick={handleImport}
                  style={{ minWidth: 170 }}
                >
                  {importing
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importing…</>
                    : <><Check size={14} /> Import {questions.length} Question{questions.length !== 1 ? 's' : ''}</>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
