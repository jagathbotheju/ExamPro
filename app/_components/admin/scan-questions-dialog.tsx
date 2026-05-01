'use client';

import { useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, ImageIcon, X, Check, ChevronDown, ChevronUp, Loader2, ScanText } from 'lucide-react';
import { toast } from 'sonner';
import { bulkCreateQuestions } from '@/actions/admin/bulkCreateQuestions';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/app/_components/ui/select';
import type { Subject, Grade, Difficulty } from '@/app/_lib/types';

interface ScannedQuestion {
  body: string;
  options: string[];
  correctIndex: number;
  difficulty: Difficulty;
  selected: boolean;
  expanded: boolean;
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

export function ScanQuestionsDialog({ subjects, grades, onClose, onImported }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [gradeId, setGradeId] = useState(grades[0]?.id ?? '');
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [questions, setQuestions] = useState<ScannedQuestion[]>([]);
  const [phase, setPhase] = useState<'upload' | 'preview'>('upload');

  const acceptFile = useCallback((f: File) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!ok.includes(f.type)) { toast.error('Upload a JPG, PNG, WebP, GIF, or PDF file.'); return; }
    if (f.size > 20 * 1024 * 1024) { toast.error('File must be under 20 MB.'); return; }
    setFile(f);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }, [acceptFile]);

  const handleScan = async () => {
    if (!file || !subjectId || !gradeId) return;
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/scan-questions', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      if (data.questions.length === 0) {
        toast.error('No MCQ questions detected in this file.');
        return;
      }
      const mapped: ScannedQuestion[] = data.questions.map((q: Omit<ScannedQuestion, 'selected' | 'expanded'>) => ({
        ...q,
        selected: true,
        expanded: false,
      }));
      setQuestions(mapped);
      setPhase('preview');
      toast.success(`Found ${mapped.length} question${mapped.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const toggleAll = (v: boolean) => setQuestions(qs => qs.map(q => ({ ...q, selected: v })));
  const toggleOne = (i: number) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, selected: !q.selected } : q));
  const toggleExpand = (i: number) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, expanded: !q.expanded } : q));
  const setCorrect = (qi: number, ci: number) => setQuestions(qs => qs.map((q, idx) => idx === qi ? { ...q, correctIndex: ci } : q));
  const setDifficulty = (qi: number, d: Difficulty) => setQuestions(qs => qs.map((q, idx) => idx === qi ? { ...q, difficulty: d } : q));

  const selectedCount = questions.filter(q => q.selected).length;

  const handleImport = async () => {
    const selected = questions.filter(q => q.selected);
    if (selected.length === 0) return;
    setImporting(true);
    try {
      const payload = selected.map(q => ({
        body: q.body,
        options: q.options,
        correctIndex: q.correctIndex,
        difficulty: q.difficulty,
        subjectId,
        gradeId,
      }));
      await bulkCreateQuestions(payload);
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
      toast.success(`${selected.length} question${selected.length !== 1 ? 's' : ''} imported`);
      onImported();
    } catch {
      toast.error('Import failed');
      setImporting(false);
    }
  };

  const isImage = file && file.type.startsWith('image/');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScanText size={18} color="var(--accent)" />
              Scan Questions from File
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {phase === 'upload'
                ? 'Upload a PDF or image — Claude will extract MCQ questions automatically.'
                : `${questions.length} questions extracted · select which to import`}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={14} /></button>
        </div>

        {phase === 'upload' ? (
          <>
            {/* Dropzone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 14,
                padding: '36px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? 'var(--accent-soft)' : 'var(--panel-2)',
                transition: 'all 0.15s',
                marginBottom: 18,
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
              />
              <Upload size={32} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {isImage ? <ImageIcon size={16} color="var(--accent)" /> : <FileText size={16} color="var(--accent)" />}
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{file.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Drop file here or click to browse</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF, JPG, PNG, WebP, GIF · max 20 MB</div>
                </>
              )}
            </div>

            {/* Subject + Grade selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!file || !subjectId || !gradeId || scanning}
                onClick={handleScan}
                style={{ minWidth: 130 }}
              >
                {scanning ? (
                  <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</>
                ) : (
                  <><ScanText size={14} /> Scan File</>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview header bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPhase('upload')}>← Back</button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {selectedCount} of {questions.length} selected
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(true)}>Select all</button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleAll(false)}>None</button>
              </div>
            </div>

            {/* Scrollable question list */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
              {questions.map((q, qi) => (
                <div
                  key={qi}
                  className="card"
                  style={{
                    marginBottom: 10,
                    padding: '12px 14px',
                    opacity: q.selected ? 1 : 0.45,
                    border: q.selected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleOne(qi)}
                      style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2,
                        background: q.selected ? 'var(--accent)' : 'var(--panel-2)',
                        border: `1.5px solid ${q.selected ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {q.selected && <Check size={11} color="#fff" />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Question number + body */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, flex: 1 }}>
                          <span style={{ color: 'var(--text-dim)', marginRight: 6 }}>Q{qi + 1}.</span>
                          {q.body}
                        </div>
                        <button className="icon-btn" style={{ flexShrink: 0 }} onClick={() => toggleExpand(qi)}>
                          {q.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* Tags row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '2px 7px', borderRadius: 6,
                          background: `color-mix(in srgb, ${DIFF_COLORS[q.difficulty]} 15%, transparent)`,
                          color: DIFF_COLORS[q.difficulty],
                        }}>
                          {q.difficulty}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Correct: option {String.fromCharCode(65 + q.correctIndex)}
                        </span>
                        {/* Inline difficulty toggle */}
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                          <button
                            key={d}
                            onClick={() => setDifficulty(qi, d)}
                            style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 5, cursor: 'pointer',
                              background: q.difficulty === d ? `color-mix(in srgb, ${DIFF_COLORS[d]} 20%, transparent)` : 'transparent',
                              color: q.difficulty === d ? DIFF_COLORS[d] : 'var(--text-dim)',
                              border: 'none',
                            }}
                          >{d}</button>
                        ))}
                      </div>

                      {/* Expanded options */}
                      {q.expanded && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {q.options.map((opt, oi) => (
                            <button
                              key={oi}
                              onClick={() => setCorrect(qi, oi)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                                padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                                background: q.correctIndex === oi ? 'rgba(45,212,191,0.12)' : 'var(--panel-2)',
                                border: `1.5px solid ${q.correctIndex === oi ? 'var(--green)' : 'var(--border)'}`,
                              }}
                            >
                              <span style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                background: q.correctIndex === oi ? 'var(--green)' : 'var(--panel)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700,
                                color: q.correctIndex === oi ? '#0a1220' : 'var(--text-muted)',
                              }}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text)' }}>{opt}</span>
                              {q.correctIndex === oi && (
                                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>CORRECT</span>
                              )}
                            </button>
                          ))}
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                            Click an option to change the correct answer
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Import footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={selectedCount === 0 || importing}
                onClick={handleImport}
                style={{ minWidth: 160 }}
              >
                {importing
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Importing…</>
                  : `Import ${selectedCount} Question${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
