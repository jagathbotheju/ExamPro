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
import type { PerformancePoint } from '@/actions/student/getPerformanceData';

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: PerformancePoint }[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const { score, count } = payload[0].payload;
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      color: 'var(--text)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--text-muted)' }}>Avg score: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{score}%</span></div>
      <div style={{ color: 'var(--text-muted)' }}>Exams: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{count}</span></div>
    </div>
  );
}

interface PerformanceChartProps {
  data?: PerformancePoint[];
  subjectColor: string;
  subjectSlug: string;
}

export function PerformanceChart({ data = [], subjectColor, subjectSlug }: PerformanceChartProps) {
  const gradId = `perf-grad-${subjectSlug}`;

  if (data.length === 0) {
    return (
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
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--panel-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}>
          📊
        </div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>No Results Found</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Complete exams for this subject to see your progress</div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={subjectColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={subjectColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 5"
          stroke="var(--border-soft)"
          vertical={false}
        />

        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />

        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
          dx={-4}
        />

        <Tooltip content={<ChartTooltip />} cursor={{ stroke: subjectColor, strokeWidth: 1, strokeDasharray: '4 3' }} />

        <Area
          type="monotone"
          dataKey="score"
          stroke={subjectColor}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          dot={{ fill: subjectColor, stroke: 'var(--bg)', strokeWidth: 2.5, r: 4 }}
          activeDot={{ fill: subjectColor, stroke: 'var(--bg)', strokeWidth: 2.5, r: 5.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
