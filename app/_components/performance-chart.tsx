'use client';

import { SUBJECTS, PERFORMANCE_DATA, MONTH_LABELS, YEAR_LABELS } from '@/app/_lib/data';

interface PerformanceChartProps {
  subjectId: string;
  timeframe: 'monthly' | 'yearly';
}

export default function PerformanceChart({ subjectId, timeframe }: PerformanceChartProps) {
  const data = PERFORMANCE_DATA[subjectId] || PERFORMANCE_DATA.math;
  const series = data[timeframe] || data.monthly;
  const labels = timeframe === 'monthly' ? MONTH_LABELS : YEAR_LABELS;
  const W = 720, H = 240, PADX = 40, PADY = 28;
  const max = 100, min = 40;
  const subj = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0];

  const xs = (i: number) => PADX + (i * (W - PADX * 2)) / (series.length - 1);
  const ys = (v: number) => PADY + ((max - v) * (H - PADY * 2)) / (max - min);

  const pts = series.map((v, i) => [xs(i), ys(v)] as [number, number]);
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const area = `${path} L ${xs(series.length - 1)} ${H - PADY} L ${PADX} ${H - PADY} Z`;
  const grid = [40, 60, 80, 100];

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`grad-${subj.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={subj.color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={subj.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map(g => (
          <g key={g}>
            <line x1={PADX} x2={W - PADX} y1={ys(g)} y2={ys(g)} stroke="#1c2845" strokeDasharray="3 4" />
            <text x={PADX - 8} y={ys(g) + 4} fill="#5b6a85" fontSize="10" textAnchor="end">{g}%</text>
          </g>
        ))}
        <path d={area} fill={`url(#grad-${subj.id})`} />
        <path d={path} fill="none" stroke={subj.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={subj.color} stroke="#0a1220" strokeWidth="2" />
        ))}
        {labels.map((l, i) => (
          <text key={i} x={xs(i)} y={H - 8} fill="#5b6a85" fontSize="10" textAnchor="middle">{l}</text>
        ))}
      </svg>
    </div>
  );
}
