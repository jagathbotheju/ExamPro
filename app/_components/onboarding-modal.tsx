'use client';

import { useState } from 'react';
import { GRADES } from '@/app/_lib/data';
import Icon from './fa-icon';

interface OnboardingModalProps {
  onComplete: (data: { school: string; grade: string; dob: string; sex: string }) => void;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-tiny" style={{ marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ school: '', grade: 'Grade 9', dob: '', sex: 'Male' });
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.school && form.grade && form.dob && form.sex;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--accent-soft)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="fa-user-plus" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Complete your profile</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {step} of 2 — required to start exams</div>
          </div>
        </div>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="School / Institution">
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="e.g. Stanford University of Medicine"
                value={form.school}
                onChange={e => update('school', e.target.value)}
              />
            </FormField>
            <FormField label="Grade">
              <select
                className="select"
                style={{ width: '100%' }}
                value={form.grade}
                onChange={e => update('grade', e.target.value)}
              >
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Date of Birth">
              <input
                type="date"
                className="input"
                style={{ width: '100%' }}
                value={form.dob}
                onChange={e => update('dob', e.target.value)}
              />
            </FormField>
            <FormField label="Sex">
              <div style={{ display: 'flex', gap: 8 }}>
                {['Male', 'Female', 'Other'].map(s => (
                  <button
                    key={s}
                    className={`btn ${form.sex === s ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => update('sex', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FormField>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 10 }}>
          {step > 1 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              <Icon name="fa-arrow-left" />
              Back
            </button>
          ) : <div />}
          {step < 2 ? (
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Continue <Icon name="fa-arrow-right" />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!valid}
              onClick={() => onComplete(form)}
            >
              Complete <Icon name="fa-check" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
