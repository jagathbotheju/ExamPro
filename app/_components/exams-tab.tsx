'use client';

import { useState, useMemo } from 'react';
import { StudentProfile, Exam, PENDING_EXAMS, COMPLETED_EXAMS, SUBJECTS, GRADES } from '@/app/_lib/data';
import Icon from './fa-icon';
import { PendingExamRow, CompletedExamRow } from './exam-rows';

interface ExamsTabProps {
  profile: StudentProfile;
  onStartExam: (exam: Exam) => void;
  onViewResult: (exam: Exam) => void;
}

function StatTile({ icon, color, label, num, trend }: {
  icon: string; color: string; label: string; num: string | number; trend: string;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-icon" style={{ background: `${color}22`, color }}>
        <Icon name={icon} />
      </div>
      <div className="stat-num" style={{ color: 'var(--text)' }}>{num}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-trend" style={{ color }}>{trend}</div>
    </div>
  );
}

export default function ExamsTab({ profile, onStartExam, onViewResult }: ExamsTabProps) {
  const [grade, setGrade] = useState(profile.grade);
  const [subject, setSubject] = useState('all');

  const filtered = (list: Exam[]) => list.filter(e => subject === 'all' || e.subject === subject);
  const pending = filtered(PENDING_EXAMS);
  const completed = filtered(COMPLETED_EXAMS);

  const avgScore = useMemo(() => {
    if (!completed.length) return 0;
    return Math.round(completed.reduce((s, e) => s + (e.score ?? 0), 0) / completed.length);
  }, [completed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>Exams</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Browse and take exams for your selected grade and subject.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="select" value={grade} onChange={e => setGrade(e.target.value)}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="select" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="all">All Subjects</option>
            {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4">
        <StatTile icon="fa-circle-check" color="var(--green)" label="Completed" num={completed.length} trend={`for ${grade}`} />
        <StatTile icon="fa-clock" color="var(--accent)" label="Pending" num={pending.length} trend="ready to take" />
        <StatTile icon="fa-chart-simple" color="var(--cyan)" label="Average Score" num={`${avgScore}%`} trend="across results" />
        <StatTile icon="fa-fire" color="var(--amber)" label="Study Streak" num={`${profile.streak}d`} trend="keep it going" />
      </div>

      {/* Pending exams */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="fa-hourglass-half" />
            Pending Exams
            <span className="pill pill-soft" style={{ marginLeft: 6 }}>{pending.length}</span>
          </div>
          <button className="btn btn-ghost btn-sm">View all <Icon name="fa-arrow-right" /></button>
        </div>
        <div className="list">
          {pending.slice(0, 5).map(e => (
            <PendingExamRow key={e.id} exam={e} onStart={onStartExam} />
          ))}
          {pending.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending exams for the current filters.
            </div>
          )}
        </div>
      </div>

      {/* Completed exams */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="fa-circle-check" />
            Completed Exams
            <span className="pill pill-soft" style={{ marginLeft: 6 }}>{completed.length}</span>
          </div>
          <button className="btn btn-ghost btn-sm">View all <Icon name="fa-arrow-right" /></button>
        </div>
        <div className="list">
          {completed.slice(0, 5).map(e => (
            <CompletedExamRow key={e.id} exam={e} onView={onViewResult} />
          ))}
          {completed.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              No completed exams for the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
