'use client'
import { useState, useEffect } from 'react'
import { Th, Td, ZeroPctBadge, useSort } from '@/components/Table'
import { fmtK, fmt$, pct } from '@/lib/constants'
import type { ProviderSummaryRow } from '@/lib/supabase'

interface Props {
  datasetId: string | null
  onDrillProvider: (therapist: string) => void
}

export default function ProviderTab({ datasetId, onDrillProvider }: Props) {
  const [summary, setSummary] = useState<ProviderSummaryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!datasetId) return
    setLoading(true)
    fetch(`/api/summary?dataset_id=${datasetId}&type=provider`)
      .then((r) => r.json())
      .then((d) => setSummary(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [datasetId])

  const { sorted, col, dir, handleSort } = useSort<ProviderSummaryRow>(summary, 'billed', 'desc')

  const filtered = sorted.filter((r) =>
    !q || r.therapist.toLowerCase().includes(q.toLowerCase())
  )

  const tv = summary.reduce(
    (acc, r) => ({
      lines: acc.lines + r.lines,
      pl: acc.pl + r.paid_lines,
      zl: acc.zl + r.zero_lines,
      billed: acc.billed + r.billed,
      allowed: acc.allowed + r.allowed,
      collected: acc.collected + r.collected,
    }),
    { lines: 0, pl: 0, zl: 0, billed: 0, allowed: 0, collected: 0 }
  )

  if (!datasetId) return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
      No data loaded.
    </div>
  )

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[10px] text-zinc-400">
          Red highlight = 30%+ denial rate · Click provider name to see their claims
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search provider…"
          className="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2.5 py-1.5 w-44
            focus:outline-none focus:border-orange-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Loading…</div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th label="Provider"    col="therapist"     active={col as string} dir={dir} onClick={() => handleSort('therapist')} />
                <Th label="Lines"       col="lines"         active={col as string} dir={dir} onClick={() => handleSort('lines')}      right />
                <Th label="Paid Lines"  col="paid_lines"    active={col as string} dir={dir} onClick={() => handleSort('paid_lines')} right />
                <Th label="$0 Lines"    col="zero_lines"    active={col as string} dir={dir} onClick={() => handleSort('zero_lines')} right />
                <Th label="Denial%"     col="zero_pct"      active={col as string} dir={dir} onClick={() => handleSort('zero_pct')}  right />
                <Th label="Billed"      col="billed"        active={col as string} dir={dir} onClick={() => handleSort('billed')}    right />
                <Th label="Allowed"     col="allowed"       active={col as string} dir={dir} onClick={() => handleSort('allowed')}   right />
                <Th label="Collected"   col="collected"     active={col as string} dir={dir} onClick={() => handleSort('collected')} right />
                <Th label="Collect%(B)" col="collect_pct"   active={col as string} dir={dir} onClick={() => handleSort('collect_pct')} right />
                <Th label="Avg/Paid"    col="collected"     active="" dir="asc" onClick={() => {}} right />
                <Th label="Primary Fac" col="primary_facility" active={col as string} dir={dir} onClick={() => handleSort('primary_facility')} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isFlag = row.zero_pct >= 0.3
                return (
                  <tr key={row.therapist}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50
                      ${isFlag ? 'bg-red-500/5' : ''}`}>
                    <Td>
                      <span className="cursor-pointer hover:text-orange-500 transition-colors font-medium"
                        onClick={() => onDrillProvider(row.therapist)}>
                        {row.therapist}
                      </span>
                    </Td>
                    <Td right>{row.lines.toLocaleString()}</Td>
                    <Td right className="text-green-500">{row.paid_lines.toLocaleString()}</Td>
                    <Td right className="text-red-500 font-semibold">{row.zero_lines.toLocaleString()}</Td>
                    <Td right><ZeroPctBadge pct={row.zero_pct} /></Td>
                    <Td right>{fmtK(row.billed)}</Td>
                    <Td right className="text-zinc-400">{fmtK(row.allowed)}</Td>
                    <Td right className="text-green-500">{fmtK(row.collected)}</Td>
                    <Td right>{(row.collect_pct * 100).toFixed(1)}%</Td>
                    <Td right className="text-zinc-400">
                      {row.paid_lines > 0 ? fmt$(row.collected / row.paid_lines) : '—'}
                    </Td>
                    <Td className="text-zinc-400 text-[10px]">{row.primary_facility}</Td>
                  </tr>
                )
              })}
              {/* Totals row */}
              <tr className="bg-orange-500/5 font-semibold">
                <Td><span className="text-orange-500">PRACTICE TOTAL</span></Td>
                <Td right>{tv.lines.toLocaleString()}</Td>
                <Td right className="text-green-500">{tv.pl.toLocaleString()}</Td>
                <Td right className="text-red-500">{tv.zl.toLocaleString()}</Td>
                <Td right><ZeroPctBadge pct={tv.zl / Math.max(1, tv.lines)} /></Td>
                <Td right>{fmtK(tv.billed)}</Td>
                <Td right>{fmtK(tv.allowed)}</Td>
                <Td right className="text-green-500">{fmtK(tv.collected)}</Td>
                <Td right>{pct(tv.collected, tv.billed)}</Td>
                <Td right>—</Td>
                <Td></Td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
