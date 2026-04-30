'use client';

import { useState } from 'react';
import { StudentProfile, Exam, COMPLETED_EXAMS, PENDING_EXAMS, SUBJECTS } from '@/app/_lib/data';
import Icon from './fa-icon';
import PerformanceChart from './performance-chart';
import { PendingExamRow, CompletedExamRow } from './exam-rows';

interface HomeTabProps {
  profile: StudentProfile;
  onStartExam: (exam: Exam) => void;
  onViewResult: (exam: Exam) => void;
  goToExams: () => void;
}

function ScoreRing({ value }: { value: number }) {
  const r = 36, c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="ring-wrap">
      <svg viewBox="0 0 88 88" width="88" height="88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1c2845" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ring-num">{value}%</div>
    </div>
  );
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

export default function HomeTab({ profile, onStartExam, onViewResult, goToExams }: HomeTabProps) {
  const [subjectId, setSubjectId] = useState('math');
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');

  const overall = Math.round(
    COMPLETED_EXAMS.reduce((s, e) => s + (e.score ?? 0), 0) / COMPLETED_EXAMS.length
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 28, alignItems: 'center' }}>
          <div className="profile-photo" style={{ width: 96, height: 96 }}>
            <div className="stripes" />
            <div className="ph-letter">{profile.initials}</div>
          </div>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span className="pill pill-green">PREMIUM LEARNER</span>
              <span className="pill pill-purple">{profile.rank} RANK</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Welcome back, {profile.shortName.split(' ')[0]}.
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {profile.track} · {profile.year} · {profile.grade}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ScoreRing value={overall} />
            <div>
              <div className="label-tiny" style={{ marginBottom: 4 }}>Overall Score</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 180 }}>
                Across {COMPLETED_EXAMS.length} completed exams
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid-4">
        <StatTile icon="fa-circle-check" color="var(--green)" label="Completed" num={COMPLETED_EXAMS.length} trend="+3 this week" />
        <StatTile icon="fa-clock" color="var(--accent)" label="Pending" num={PENDING_EXAMS.length} trend="2 due soon" />
        <StatTile icon="fa-bullseye" color="var(--cyan)" label="Avg. Accuracy" num={`${profile.accuracy}%`} trend="+4% vs last month" />
        <StatTile icon="fa-fire" color="var(--amber)" label="Study Streak" num={`${profile.streak}d`} trend="Best: 21 days" />
      </div>

      {/* Performance Analytics */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="fa-chart-line" />
            Performance Analytics
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="select" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="seg">
              <button
                className={`seg-btn ${timeframe === 'monthly' ? 'active' : ''}`}
                onClick={() => setTimeframe('monthly')}
              >
                Monthly
              </button>
              <button
                className={`seg-btn ${timeframe === 'yearly' ? 'active' : ''}`}
                onClick={() => setTimeframe('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>
        <PerformanceChart subjectId={subjectId} timeframe={timeframe} />
      </div>

      {/* Pending exams */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="fa-hourglass-half" />
            Pending Exams
            <span className="pill pill-soft" style={{ marginLeft: 6 }}>{PENDING_EXAMS.length}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={goToExams}>
            View all <Icon name="fa-arrow-right" />
          </button>
        </div>
        <div className="list">
          {PENDING_EXAMS.slice(0, 5).map(e => (
            <PendingExamRow key={e.id} exam={e} onStart={onStartExam} />
          ))}
        </div>
      </div>

      {/* Completed exams */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <Icon name="fa-circle-check" />
            Completed Exams
            <span className="pill pill-soft" style={{ marginLeft: 6 }}>{COMPLETED_EXAMS.length}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={goToExams}>
            View all <Icon name="fa-arrow-right" />
          </button>
        </div>
        <div className="list">
          {COMPLETED_EXAMS.slice(0, 5).map(e => (
            <CompletedExamRow key={e.id} exam={e} onView={onViewResult} />
          ))}
        </div>
      </div>
    </div>
  );
}
