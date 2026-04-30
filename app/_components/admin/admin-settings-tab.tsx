'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getGrades, createGrade, updateGrade, deleteGrade,
} from '@/actions/admin/manageSubjectsGrades';
import { queryKeys } from '@/app/_lib/query-keys';
import { useTheme } from '@/app/_lib/use-theme';
import { Switch } from '@/app/_components/ui/switch';
import type { Subject, Grade } from '@/app/_lib/types';

const SUBJECT_COLORS = [
  'var(--accent)', 'var(--cyan)', 'var(--green)', 'var(--amber)',
  'var(--pink)', 'var(--red)',
];

function AdminProfileHero() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded || !user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const email = user.primaryEmailAddress?.emailAddress ?? '';
  const joinedDate = user.createdAt
    ? new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(user.createdAt))
    : '';

  return (
    <div className="card flex items-center gap-5" style={{ paddingTop: 18, paddingBottom: 18 }}>

      {/* Avatar */}
      <div className="w-[72px] h-[72px] rounded-[14px] shrink-0 bg-gradient-to-br from-[#7c5cff] to-[#4f35cc] flex items-center justify-center text-[26px] font-bold text-white tracking-[-0.01em]">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-[5px]">
          <span className="text-[11px] font-bold tracking-[0.06em] uppercase bg-[var(--accent-soft)] text-[var(--accent)] px-2 py-[3px] rounded-[6px]">
            Admin
          </span>
          <span className="text-[11px] font-semibold tracking-[0.04em] uppercase bg-[var(--panel-2)] text-[var(--text-muted)] px-2 py-[3px] rounded-[6px]">
            Lead Administrator
          </span>
        </div>
        <div className="text-lg font-bold text-[var(--text)] leading-[1.2]">{fullName}</div>
        <div className="text-xs text-[var(--text-muted)] mt-[3px]">
          {email}{joinedDate ? ` · joined ${joinedDate}` : ''}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => signOut(() => router.push('/sign-in'))}
        className="btn btn-red shrink-0"
      >
        <LogOut size={14} />
        Logout
      </button>
    </div>
  );
}

export function AdminSettingsTab() {
  const qc = useQueryClient();
  const [subjectDialog, setSubjectDialog] = useState<Subject | null | 'new'>(null);
  const [gradeDialog, setGradeDialog] = useState<Grade | null | 'new'>(null);

  const { data: subjectsRaw = [] } = useQuery({ queryKey: queryKeys.subjects(), queryFn: getSubjects });
  const { data: gradesRaw = [] } = useQuery({ queryKey: queryKeys.grades(), queryFn: getGrades });

  const subjects = subjectsRaw as Subject[];
  const grades = gradesRaw as Grade[];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['subjects'] });
    qc.invalidateQueries({ queryKey: ['grades'] });
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject? Questions linked to it will lose their subject tag.')) return;
    try { await deleteSubject(id); invalidate(); toast.success('Subject deleted'); }
    catch { toast.error('Failed to delete subject'); }
  };

  const handleDeleteGrade = async (id: string) => {
    if (!confirm('Delete this grade?')) return;
    try { await deleteGrade(id); invalidate(); toast.success('Grade deleted'); }
    catch { toast.error('Failed to delete grade'); }
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Profile</h1>
      <AdminProfileHero />

      <div>
        <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">Settings</h1>
        <div className="text-[13px] text-[var(--text-muted)] mt-1">Manage subjects, grades, and platform configuration.</div>
      </div>

      {/* Subjects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="card-title !mb-0">Subjects</div>
          <button className="btn btn-soft btn-sm" onClick={() => setSubjectDialog('new')}>
            <Plus size={12} /> Add Subject
          </button>
        </div>
        <div className="list">
          {subjects.length === 0 ? (
            <div className="py-5 text-center text-[var(--text-muted)] text-[13px]">No subjects yet.</div>
          ) : subjects.map(s => (
            <div key={s.id} className="list-row">
              <div className="flex items-center gap-[14px]">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0"
                  style={{ background: `${s.color}22` }}
                >
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div>
                  <div className="list-name">{s.name}</div>
                  <div className="list-meta">
                    <span className="font-mono text-[11px]">{s.slug}</span>
                    <span className="text-[var(--text-dim)]">·</span>
                    <span className="font-semibold" style={{ color: s.color }}>{s.color}</span>
                  </div>
                </div>
              </div>
              <div className="list-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setSubjectDialog(s)}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="icon-btn" onClick={() => handleDeleteSubject(s.id)}>
                  <Trash2 size={14} color="var(--red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="card-title !mb-0">Grade Levels</div>
          <button className="btn btn-soft btn-sm" onClick={() => setGradeDialog('new')}>
            <Plus size={12} /> Add Grade
          </button>
        </div>
        <div className="list">
          {grades.length === 0 ? (
            <div className="py-5 text-center text-[var(--text-muted)] text-[13px]">No grades yet.</div>
          ) : grades.map(g => (
            <div key={g.id} className="list-row">
              <div className="flex items-center gap-[14px]">
                <div className="w-9 h-9 rounded-[10px] bg-[var(--panel-2)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                  {g.order}
                </div>
                <div className="list-name">{g.label}</div>
              </div>
              <div className="list-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setGradeDialog(g)}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="icon-btn" onClick={() => handleDeleteGrade(g.id)}>
                  <Trash2 size={14} color="var(--red)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Preferences */}
      <AdminPreferences />

      {subjectDialog && (
        <SubjectDialog
          subject={subjectDialog === 'new' ? undefined : subjectDialog}
          onClose={() => setSubjectDialog(null)}
          onSaved={() => { setSubjectDialog(null); invalidate(); }}
        />
      )}
      {gradeDialog && (
        <GradeDialog
          grade={gradeDialog === 'new' ? undefined : gradeDialog}
          nextOrder={grades.length + 1}
          onClose={() => setGradeDialog(null)}
          onSaved={() => { setGradeDialog(null); invalidate(); }}
        />
      )}
    </div>
  );
}

function PrefRow({ label, sub, checked, onCheckedChange }: {
  label: string;
  sub: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="list-row">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function AdminPreferences() {
  const { isDark, setDark } = useTheme();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);

  return (
    <div className="card">
      <div className="card-title">Admin Preferences</div>
      <div className="list">
        <PrefRow
          label="Email notifications"
          sub="Receive alerts when students complete exams"
          checked={emailNotifs}
          onCheckedChange={setEmailNotifs}
        />
        <PrefRow
          label="Auto-publish exams"
          sub="Publish exams immediately upon creation"
          checked={autoPublish}
          onCheckedChange={setAutoPublish}
        />
        <PrefRow
          label="Dark mode"
          sub="Use the dark theme across the admin console"
          checked={isDark}
          onCheckedChange={setDark}
        />
      </div>
    </div>
  );
}

function SubjectDialog({ subject, onClose, onSaved }: {
  subject?: Subject; onClose: () => void; onSaved: () => void;
}) {
  const editing = !!subject;
  const [name, setName] = useState(subject?.name ?? '');
  const [slug, setSlug] = useState(subject?.slug ?? '');
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(subject?.icon ?? '📚');
  const [saving, setSaving] = useState(false);

  const autoSlug = (n: string) => n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      if (editing && subject) {
        await updateSubject(subject.id, { name: name.trim(), color, icon });
        toast.success('Subject updated');
      } else {
        await createSubject({ slug: slug.trim(), name: name.trim(), color, icon });
        toast.success('Subject added');
      }
      onSaved();
    } catch { toast.error('Failed to save'); setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-[18px]">
          <div className="text-lg font-bold">{editing ? 'Edit Subject' : 'Add Subject'}</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mb-[14px]">
          <div className="label-tiny mb-1.5">Name</div>
          <input
            className="input" placeholder="e.g. Mathematics" value={name}
            onChange={e => { setName(e.target.value); if (!editing) setSlug(autoSlug(e.target.value)); }}
          />
        </div>
        {!editing && (
          <div className="mb-[14px]">
            <div className="label-tiny mb-1.5">Slug</div>
            <input className="input" placeholder="e.g. math" value={slug} onChange={e => setSlug(autoSlug(e.target.value))} />
          </div>
        )}
        <div className="mb-[14px]">
          <div className="label-tiny mb-2">Color</div>
          <div className="flex gap-2 flex-wrap">
            {SUBJECT_COLORS.map(c => (
              <button
                key={c} onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full border-none cursor-pointer outline-offset-2"
                style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none' }}
              />
            ))}
          </div>
        </div>
        <div className="mb-[18px]">
          <div className="label-tiny mb-1.5">Icon (emoji or text)</div>
          <input className="input w-20" value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} />
        </div>

        <div className="flex justify-end gap-[10px]">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!name.trim() || !slug.trim() || saving} onClick={handleSave}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Add Subject'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GradeDialog({ grade, nextOrder, onClose, onSaved }: {
  grade?: Grade; nextOrder: number; onClose: () => void; onSaved: () => void;
}) {
  const editing = !!grade;
  const [label, setLabel] = useState(grade?.label ?? '');
  const [order, setOrder] = useState(grade?.order ?? nextOrder);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      if (editing && grade) {
        await updateGrade(grade.id, label.trim());
        toast.success('Grade updated');
      } else {
        await createGrade({ label: label.trim(), order });
        toast.success('Grade added');
      }
      onSaved();
    } catch { toast.error('Failed to save'); setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal !max-w-[380px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-[18px]">
          <div className="text-lg font-bold">{editing ? 'Edit Grade' : 'Add Grade'}</div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mb-[14px]">
          <div className="label-tiny mb-1.5">Label</div>
          <input className="input" placeholder="e.g. Grade 10" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        {!editing && (
          <div className="mb-[18px]">
            <div className="label-tiny mb-1.5">Sort Order</div>
            <input type="number" min={1} className="input" value={order} onChange={e => setOrder(Math.max(1, +e.target.value))} />
          </div>
        )}

        <div className="flex justify-end gap-[10px]">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!label.trim() || saving} onClick={handleSave}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Add Grade'}
          </button>
        </div>
      </div>
    </div>
  );
}
