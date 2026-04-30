'use client';

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { Edit2, LogOut, CheckCircle2, Target, Clock, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getInitials, calcAge, formatDate } from '@/app/_lib/utils';
import { updateProfile } from '@/actions/student/updateProfile';
import { getCompletedExams } from '@/actions/student/getCompletedExams';
import { queryKeys } from '@/app/_lib/query-keys';
import type { StudentProfile } from '@/app/_lib/types';

const GRADES = ['Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','Grade 13'];

function useClerkSignOut() {
  const clerk = useClerk();
  return () => clerk.signOut({ redirectUrl: '/sign-in' });
}

interface ProfileTabProps { profile: StudentProfile | null }

export function ProfileTab({ profile }: ProfileTabProps) {
  const qc = useQueryClient();
  const signOut = useClerkSignOut();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    school: profile?.school ?? '',
    grade: profile?.grade ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    sex: profile?.sex ?? '',
  });

  const { data: completed = [] } = useQuery({
    queryKey: queryKeys.completedExams(),
    queryFn: () => getCompletedExams(),
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => { setEditing(false); qc.invalidateQueries({ queryKey: queryKeys.profile() }); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to save'),
  });

  const initials = profile ? getInitials(profile.name) : '?';
  const avgScore = completed.length ? Math.round(completed.reduce((s, c) => s + c.score, 0) / completed.length) : 0;
  const age = calcAge(profile?.dateOfBirth ?? null);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="card card-hero">
        <div className="grid grid-cols-[auto_1fr_auto] gap-6 items-center">
          <div className="profile-photo">
            <div className="stripes" />
            <div className="ph-letter">{initials[0]}</div>
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <span className="pill pill-purple">STUDENT</span>
              {profile?.grade && <span className="pill pill-soft">{profile.grade.toUpperCase()}</span>}
            </div>
            <div className="text-[22px] font-bold tracking-[-0.01em]">{profile?.name ?? '—'}</div>
            <div className="text-[13px] text-[var(--text-muted)] mt-1">
              {profile?.email ?? '—'}
              {profile?.school ? ` · ${profile.school}` : ''}
            </div>
          </div>
          <button className="btn btn-red" onClick={signOut}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <div className="stat-tile">
          <div className="stat-icon-chip" style={{ background: 'var(--green)22' }}><CheckCircle2 size={16} color="var(--green)" /></div>
          <div className="stat-num">{completed.length}</div>
          <div className="stat-label">Exams Taken</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon-chip" style={{ background: 'var(--cyan)22' }}><Target size={16} color="var(--cyan)" /></div>
          <div className="stat-num">{avgScore}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon-chip" style={{ background: 'var(--amber)22' }}><Clock size={16} color="var(--amber)" /></div>
          <div className="stat-num">{profile?.studyStreak ?? 0}</div>
          <div className="stat-label">Study Streak</div>
        </div>
        <div className="stat-tile">
          <div className="stat-icon-chip" style={{ background: 'var(--accent)22' }}><Award size={16} color="var(--accent)" /></div>
          <div className="stat-num">{avgScore >= 90 ? 'Gold' : avgScore >= 75 ? 'Silver' : 'Bronze'}</div>
          <div className="stat-label">Rank</div>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <div className="section-header">
          <div className="card-title m-0">Profile Details</div>
          {!editing && (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
              <Edit2 size={12} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-[14px]">
            <div className="grid-2">
              <div>
                <div className="label-tiny mb-1.5">Full Name</div>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <div className="label-tiny mb-1.5">School</div>
                <input className="input" value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} />
              </div>
            </div>
            <div className="grid-3">
              <div>
                <div className="label-tiny mb-1.5">Grade</div>
                <select className="select" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                  <option value="">Select grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <div className="label-tiny mb-1.5">Date of Birth</div>
                <input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <div className="label-tiny mb-1.5">Sex</div>
                <select className="select" value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-[10px] justify-end">
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate(form)}>
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid-2 gap-[18px]">
            {[
              { label: 'Full Name',     value: profile?.name },
              { label: 'Email',         value: profile?.email },
              { label: 'School',        value: profile?.school },
              { label: 'Grade',         value: profile?.grade },
              { label: 'Date of Birth', value: formatDate(profile?.dateOfBirth ?? null) },
              { label: 'Age',           value: age ? `${age} years` : '—' },
              { label: 'Sex',           value: profile?.sex },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="label-tiny mb-1">{label}</div>
                <div className={`text-sm ${value ? 'text-[var(--text)]' : 'text-[var(--text-dim)]'}`}>{value || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
