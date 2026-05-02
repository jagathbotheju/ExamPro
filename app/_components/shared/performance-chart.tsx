'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { MultiPerformancePoint } from '@/actions/student/getPerformanceData';

interface MultiTooltipProps {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
  subjectNames: Record<string, string>;
}

function MultiTooltip({ active, payload, label, subjectNames }: MultiTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      color: 'var(--text)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      minWidth: 140,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: p.color }}>{subjectNames[p.dataKey] ?? p.dataKey}</span>
          <span style={{ fontWeight: 700 }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

const EmptyState = () => (
  <div style={{
    height: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    color: 'var(--text-muted)',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      background: 'var(--panel-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
    }}>📊</div>
    <div style={{ fontSize: 13, fontWeight: 500 }}>No Results Found</div>
    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Complete exams to see your progress</div>
  </div>
);

interface SubjectMeta { slug: string; color: string; name: string }

interface PerformanceChartProps {
  multiData: MultiPerformancePoint[];
  allSubjects: SubjectMeta[];
}

export function PerformanceChart({ multiData, allSubjects }: PerformanceChartProps) {
  const hasAnyScore = multiData.some(p =>
    Object.keys(p).some(k => k !== 'month' && k !== 'monthIndex'),
  );
  if (multiData.length === 0 || !hasAnyScore) return <EmptyState />;

  const presentSlugs = new Set(
    multiData.flatMap(p => Object.keys(p).filter(k => k !== 'month' && k !== 'monthIndex')),
  );
  const visibleSubjects = allSubjects.filter(s => presentSlugs.has(s.slug));
  const subjectNames = Object.fromEntries(allSubjects.map(s => [s.slug, s.name]));

  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={multiData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            {visibleSubjects.map(s => (
              <linearGradient key={s.slug} id={`perf-grad-all-${s.slug}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 5" stroke="var(--border-soft)" vertical={false} />
          <XAxis
            dataKey="month"
            interval={0}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-dim)', fontSize: 11, dy: 6 }}
          />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: 'var(--text-dim)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} dx={-4} />
          <Tooltip content={<MultiTooltip subjectNames={subjectNames} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 3' }} />
          {visibleSubjects.map(s => (
            <Area
              key={s.slug}
              type="monotone"
              dataKey={s.slug}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#perf-grad-all-${s.slug})`}
              dot={{ fill: s.color, stroke: 'var(--bg)', strokeWidth: 2, r: 3.5 }}
              activeDot={{ fill: s.color, stroke: 'var(--bg)', strokeWidth: 2.5, r: 5 }}
              connectNulls
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 12 }}>
        {visibleSubjects.map(s => (
          <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            {s.name}
          </div>
        ))}
      </div>
    </>
  );
}
