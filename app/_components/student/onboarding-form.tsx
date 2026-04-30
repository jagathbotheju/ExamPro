'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProfile } from '@/actions/student/updateProfile';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Calendar } from '@/app/_components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/_components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/app/_lib/utils';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];
const SEX_OPTIONS = ['Male', 'Female'] as const;

interface Props { name: string }

export function OnboardingForm({ name: initialName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialName);
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [sex, setSex] = useState('');
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false)

  const step1Valid = name.trim() && school.trim() && grade;
  const step2Valid = dob && sex;

  async function handleComplete() {
    if (!step2Valid) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), school, grade, dateOfBirth: format(dob!, 'yyyy-MM-dd'), sex });
      toast.success('Profile complete! Welcome to ExamPro.');
      router.replace('/dashboard');
    } catch {
      toast.error('Failed to save profile');
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div className="modal" style={{ maxWidth: 460 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {step === 1 ? 'Tell us about you' : 'A bit more info'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Step {step} of 2 — complete your profile to start taking exams
          </div>
          <div style={{ marginTop: 12, height: 4, background: 'var(--panel-2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${step * 50}%`, height: '100%',
              background: 'var(--accent)', transition: 'width 300ms ease', borderRadius: 4,
            }} />
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onboard-name" className="label-tiny">Full Name</Label>
              <Input
                id="onboard-name"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-soft)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onboard-school" className="label-tiny">School Name</Label>
              <Input
                id="onboard-school"
                placeholder="e.g. Royal College"
                value={school}
                onChange={e => setSchool(e.target.value)}
                className="bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-soft)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="label-tiny">Grade</Label>
              <Select value={grade} onValueChange={v => setGrade(v ?? '')}>
                <SelectTrigger className="w-full bg-[var(--panel-2)] border-[var(--border)] text-[var(--text)] data-placeholder:text-[var(--text-dim)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-soft)]">
                  <SelectValue placeholder="Select your grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex flex-col gap-1.5">
              <Label className="label-tiny">Date of Birth</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger
                  className={cn(
                    'flex w-full items-center justify-start gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-left text-sm font-normal hover:bg-[var(--panel-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                    !dob ? 'text-[var(--text-dim)]' : 'text-[var(--text)]'
                  )}
                >
                  <CalendarIcon className="size-4 shrink-0" />
                  {dob ? format(dob, 'PPP') : 'Select your date of birth'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[var(--panel)] border-[var(--border)]" align="start">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={(newDate) => { setDob(newDate); setCalendarOpen(false); }}
                    captionLayout="dropdown"
                    startMonth={new Date(1980, 0)}
                    endMonth={new Date(new Date().getFullYear() - 5, 11)}
                    defaultMonth={dob ?? new Date(2000, 0)}
                    disabled={{ after: new Date(new Date().getFullYear() - 5, 11, 31) }}
                    className="bg-[var(--panel)]"
                    classNames={{
                      month_caption: 'flex h-9 w-full items-center justify-center px-9',
                      dropdowns: 'flex h-9 w-full items-center justify-center gap-1.5 text-sm font-medium',
                      caption_label: 'flex items-center gap-1 rounded text-sm font-medium text-[var(--text)] select-none cursor-pointer [&>svg]:size-3.5 [&>svg]:text-[var(--text-muted)]',
                      dropdown_root: 'relative rounded h-9 overflow-hidden',
                      weekday: 'text-[var(--text-muted)] flex-1 rounded text-xs font-normal select-none',
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="label-tiny">Sex</Label>
              <div style={{ display: 'flex', gap: 10 }}>
                {SEX_OPTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${sex === s ? 'var(--accent)' : 'var(--border)'}`,
                      background: sex === s ? 'var(--accent)' : 'transparent',
                      color: sex === s ? '#fff' : 'var(--text-muted)',
                      fontWeight: 500,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                      if (sex !== s) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--panel-2)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (sex !== s) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                      }
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          {step === 2 ? (
            <Button
              variant="outline"
              className="border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          ) : <div />}

          {step === 1 ? (
            <Button
              disabled={!step1Valid}
              className="bg-[var(--accent)] border-[var(--accent)] text-white hover:bg-[var(--accent-strong)] disabled:opacity-45"
              onClick={() => setStep(2)}
            >
              Continue →
            </Button>
          ) : (
            <Button
              disabled={!step2Valid || saving}
              className="bg-[var(--accent)] border-[var(--accent)] text-white hover:bg-[var(--accent-strong)] disabled:opacity-45"
              onClick={handleComplete}
            >
              {saving ? 'Saving…' : 'Complete Profile'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
