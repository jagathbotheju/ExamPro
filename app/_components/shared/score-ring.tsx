'use client';

import { getGrade } from '@/app/_lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const { color } = getGrade(score);
  const R = (size - 16) / 2;
  const C = 2 * Math.PI * R;
  const filled = C * (score / 100);

  return (
    <div className="score-ring-wrap" style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg style={{ position: 'absolute', inset: 0 }} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke="var(--panel-2)" strokeWidth="10"
        />
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke="url(#ringGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${C}`}
          strokeDashoffset={C / 4}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, fontFeatureSettings: '"tnum"', lineHeight: 1 }}>
          {score}%
        </span>
      </div>
    </div>
  );
}
