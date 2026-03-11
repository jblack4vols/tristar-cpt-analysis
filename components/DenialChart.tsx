'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CPT_DESC, fmtK } from '@/lib/constants'
import type { CPTSummaryRow } from '@/lib/supabase'

interface Props {
  data: CPTSummaryRow[]
}

export default function DenialChart({ data }: Props) {
  // Top 10 CPTs by zero_risk, only those with some denials
  const chartData = [...data]
    .filter((r) => r.zero_lines > 0)
    .sort((a, b) => b.zero_risk - a.zero_risk)
    .slice(0, 10)
    .map((r) => ({
      cpt: r.cpt,
      label: `${r.cpt} ${(CPT_DESC[r.cpt] || '').substring(0, 16)}`,
      denial_pct: Math.round(r.zero_pct * 100),
      zero_risk: r.zero_risk,
      zero_lines: r.zero_lines,
    }))

  if (chartData.length === 0) return null

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900">
      <div className="text-[10px] text-zinc-400 uppercase tracking-wide mb-2 font-medium">
        Top Denial Risk by CPT ($ at Risk)
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 10, top: 5, bottom: 5 }}>
          <XAxis type="number" tickFormatter={(v: number) => fmtK(v)}
            tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={80}
            tick={{ fontSize: 9, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 6, fontSize: 11 }}
            labelStyle={{ color: '#f97316', fontWeight: 600, marginBottom: 2 }}
            formatter={(value: number, name: string) => [
              name === 'zero_risk' ? fmtK(value) : `${value}%`,
              name === 'zero_risk' ? '$ at Risk' : 'Denial %',
            ]}
          />
          <Bar dataKey="zero_risk" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.cpt} fill={entry.denial_pct >= 40 ? '#ef4444' : entry.denial_pct >= 20 ? '#f59e0b' : '#f97316'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
