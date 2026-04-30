'use client';

import { useState } from 'react';
import { StudentProfile, GRADES } from '@/app/_lib/data';
import Icon from './fa-icon';

interface ProfileTabProps {
  profile: StudentProfile;
  onProfileChange: (changes: Partial<StudentProfile>) => void;
  onLogout: () => void;
}

function DetailField({ label, value, custom }: { label: string; value?: string; custom?: React.ReactNode }) {
  return (
    <div>
      <div className="label-tiny" style={{ marginBottom: 8 }}>{label}</div>
      {custom || <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{value}</div>}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color, fontFeatureSettings: '"tnum"' }}>{value}</span>
    </div>
  );
}

function SettingRow({ iconName, iconColor, title, subtitle, on, onToggle }: {
  iconName: string; iconColor: string; title: string; subtitle: string; on: boolean; onToggle: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px' }}>
      <div className="subj-icon" style={{ background: `${iconColor}22`, color: iconColor }}>
        <Icon name={iconName} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div
        className={`switch ${on ? 'on' : ''}`}
        onClick={onToggle}
        role="switch"
        aria-checked={on}
      />
    </div>
  );
}

export default function ProfileTab({ profile, onProfileChange, onLogout }: ProfileTabProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [grade, setGrade] = useState(profile.grade);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center' }}>
        <div className="profile-photo">
          <div className="stripes" />
          <div className="ph-letter">{profile.initials}</div>
          <div className="ph-edit"><Icon name="fa-pen" style={{ fontSize: 12 }} /></div>
        </div>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span className="pill pill-green">PREMIUM LEARNER</span>
            <span className="pill pill-purple">TOP 5% RANK</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>{profile.shortName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {profile.track} · {profile.year}
          </div>
        </div>
        <button className="btn btn-red" onClick={onLogout}>
          <Icon name="fa-right-from-bracket" />
          Logout
        </button>
      </div>

      {/* Two-column: Profile Details + Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title">
            <Icon name="fa-id-card" />
            Profile Details
          </div>
          <div className="grid-2" style={{ gap: 22 }}>
            <DetailField label="Full Name" value={profile.name} />
            <DetailField label="School / Institution" value={profile.school} />
            <DetailField
              label="Current Grade"
              custom={
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={grade}
                  onChange={e => { setGrade(e.target.value); onProfileChange({ grade: e.target.value }); }}
                >
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              }
            />
            <DetailField label="Age / D.O.B" value={`${profile.age} years · ${profile.dob}`} />
            <DetailField label="Sex" value={profile.sex} />
            <DetailField label="Email" value={profile.email} />
          </div>
        </div>

        <div className="card">
          <div className="label-tiny" style={{ marginBottom: 16 }}>Quick Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StatRow label="Exams Taken" value={profile.examsTaken} color="var(--text)" />
            <StatRow label="Avg. Accuracy" value={`${profile.accuracy}%`} color="var(--green)" />
            <StatRow label="Focus Hours" value={`${profile.focusHours}h`} color="var(--cyan)" />
            <StatRow label="Member Since" value={profile.joined} color="var(--text-muted)" />
          </div>
          <div className="divider" />
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            <Icon name="fa-chart-line" />
            View Full Report
          </button>
        </div>
      </div>

      {/* Account settings */}
      <div className="card">
        <div className="card-title">
          <Icon name="fa-gear" />
          Account Settings
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SettingRow
            iconName="fa-moon"
            iconColor="var(--accent)"
            title="Toggle Dark Mode"
            subtitle="Change UI between light and dark mode"
            on={darkMode}
            onToggle={() => setDarkMode(d => !d)}
          />
          <SettingRow
            iconName="fa-eye"
            iconColor="var(--cyan)"
            title="Public Profile Visibility"
            subtitle="Allow others to see your exam rankings"
            on={publicProfile}
            onToggle={() => setPublicProfile(p => !p)}
          />
          <SettingRow
            iconName="fa-envelope"
            iconColor="var(--green)"
            title="Email Notifications"
            subtitle="Get reminders for upcoming exams and results"
            on={emailNotifs}
            onToggle={() => setEmailNotifs(e => !e)}
          />
        </div>
      </div>
    </div>
  );
}
