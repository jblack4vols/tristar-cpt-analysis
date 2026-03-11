'use client'
import { useState, useEffect } from 'react'
import { Th, Td, ZeroPctBadge, PriBadge, useSort } from '@/components/Table'
import { getPriority, fmtK, fmt$, pct } from '@/lib/constants'
import type { PayerSummaryRow } from '@/lib/supabase'

interface Props {
  datasetId: string | null
  onDrillPayer: (payer: string) => void
}

export default function PayerTab({ datasetId, onDrillPayer }: Props) {
  const [summary, setSummary] = useState<PayerSummaryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [priFilter, setPriFilter] = useState<'all' | 'H' | 'M' | 'L'>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!datasetId) return
    setLoading(true)
    fetch(`/api/summary?dataset_id=${datasetId}&type=payer`)
      .then((r) => r.json())
      .then((d) => setSummary(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [datasetId])

  const { sorted, col, dir, handleSort } = useSort<PayerSummaryRow>(summary, 'zero_risk', 'desc')

  const filtered = sorted.filter((row) => {
    const [pri] = getPriority(row.payer)
    if (priFilter !== 'all' && pri !== priFilter) return false
    if (q && !row.payer.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const totalBilled = summary.reduce((s, r) => s + r.billed, 0)
  const totalColl   = summary.reduce((s, r) => s + r.collected, 0)
  const totalZero   = summary.reduce((s, r) => s + r.zero_lines, 0)
  const totalLines  = summary.reduce((s, r) => s + r.lines, 0)

  if (!datasetId) return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
      No data loaded.
    </div>
  )

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total Payers', val: summary.length, cls: 'text-orange-500' },
          { label: 'Total Lines',  val: totalLines.toLocaleString(), cls: '' },
          { label: 'Total Billed', val: fmtK(totalBilled), cls: '' },
          { label: 'Total Collected', val: fmtK(totalColl), cls: 'text-green-500' },
          { label: 'Zero-Pay Lines', val: totalZero.toLocaleString(), cls: 'text-red-500' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200
            dark:border-zinc-800 rounded-lg px-4 py-3">
            <div className="text-[9px] text-zinc-400 uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-xl font-bold ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search payer…"
          className="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2.5 py-1.5 w-52
            focus:outline-none focus:border-orange-500"
        />
        <div className="flex gap-0.5">
          {(['all', 'H', 'M', 'L'] as const).map((p) => (
            <button key={p}
              onClick={() => setPriFilter(p)}
              className={`text-[10px] px-2.5 py-1.5 rounded border font-medium transition-colors
                ${priFilter === p
                  ? 'bg-orange-500 border-orange-500 text-black'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
            >
              {p === 'all' ? 'All' : p === 'H' ? 'HIGH' : p === 'M' ? 'MED' : 'LOW'}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-zinc-400">{filtered.length} payers</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Loading…</div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th label="Payer"     col="payer"      active={col as string} dir={dir} onClick={() => handleSort('payer')} />
                <Th label="Priority"  col="payer"      active="" dir="asc" onClick={() => {}} />
                <Th label="Lines"     col="lines"      active={col as string} dir={dir} onClick={() => handleSort('lines')}      right />
                <Th label="$0 Lines"  col="zero_lines" active={col as string} dir={dir} onClick={() => handleSort('zero_lines')} right />
                <Th label="Denial%"   col="zero_pct"   active={col as string} dir={dir} onClick={() => handleSort('zero_pct')}  right />
                <Th label="Billed"    col="billed"     active={col as string} dir={dir} onClick={() => handleSort('billed')}    right />
                <Th label="Collected" col="collected"  active={col as string} dir={dir} onClick={() => handleSort('collected')} right />
                <Th label="Collect%"  col="collect_pct" active={col as string} dir={dir} onClick={() => handleSort('collect_pct')} right />
                <Th label="Zero Risk" col="zero_risk"  active={col as string} dir={dir} onClick={() => handleSort('zero_risk')} right />
                <Th label="Action"    col="payer"      active="" dir="asc" onClick={() => {}} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const [pri, action] = getPriority(row.payer)
                return (
                  <tr key={row.payer} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50
                    ${row.zero_pct >= 0.4 ? 'bg-red-500/5' : row.zero_pct >= 0.2 ? 'bg-yellow-500/5' : ''}`}>
                    <Td>
                      <span className="cursor-pointer hover:text-orange-500 transition-colors
                        text-[11px]"
                        onClick={() => onDrillPayer(row.payer)}>
                        {row.payer}
                      </span>
                    </Td>
                    <Td><PriBadge pri={pri} /></Td>
                    <Td right>{row.lines.toLocaleString()}</Td>
                    <Td right className="text-red-500 font-semibold">{row.zero_lines.toLocaleString()}</Td>
                    <Td right><ZeroPctBadge pct={row.zero_pct} /></Td>
                    <Td right>{fmtK(row.billed)}</Td>
                    <Td right className="text-green-500">{fmtK(row.collected)}</Td>
                    <Td right>{(row.collect_pct * 100).toFixed(1)}%</Td>
                    <Td right className={row.zero_risk > 50000 ? 'text-red-500' : row.zero_risk > 10000 ? 'text-yellow-500' : 'text-zinc-400'}>
                      {fmtK(row.zero_risk)}
                    </Td>
                    <Td className="text-[10px] text-zinc-400 max-w-[220px] whitespace-normal">
                      {action}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
