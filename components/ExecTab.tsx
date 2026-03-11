'use client'
import { useState, useEffect } from 'react'
import { Th, Td, ZeroPctBadge, useSort } from '@/components/Table'
import DrillPanel from '@/components/DrillPanel'
import { CPT_DESC, fmtK } from '@/lib/constants'
import type { CPTSummaryRow } from '@/lib/supabase'

interface Props {
  datasetId: string | null
}

type DrillFilter = 'all' | 'paid' | 'zero'

export default function ExecTab({ datasetId }: Props) {
  const [summary, setSummary] = useState<CPTSummaryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [drillCpt, setDrillCpt] = useState<string | null>(null)
  const [drillFilter, setDrillFilter] = useState<DrillFilter>('all')

  const { sorted, col, dir, handleSort } = useSort<CPTSummaryRow>(
    summary,
    'zero_risk',
    'desc'
  )

  useEffect(() => {
    if (!datasetId) return
    setLoading(true)
    fetch(`/api/summary?dataset_id=${datasetId}&type=cpt`)
      .then((r) => r.json())
      .then((d) => setSummary(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [datasetId])

  function drill(cpt: string, filter: DrillFilter) {
    setDrillCpt(cpt)
    setDrillFilter(filter)
  }

  if (!datasetId) return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
      No data loaded. Import a dataset to get started.
    </div>
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* LEFT: CPT Summary Table */}
      <div className="w-[620px] min-w-[620px] border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800
          bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-400 flex-shrink-0">
          Click any value to drill into individual claims
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
            Loading...
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th label="CPT"       col="cpt"        active={col as string} dir={dir} onClick={() => handleSort('cpt')} />
                  <Th label="Description" col="cpt"      active={col as string} dir={dir} onClick={() => {}} className="w-40" />
                  <Th label="Lines"     col="lines"      active={col as string} dir={dir} onClick={() => handleSort('lines')}      right />
                  <Th label="Paid"      col="paid_lines" active={col as string} dir={dir} onClick={() => handleSort('paid_lines')} right />
                  <Th label="$0"        col="zero_lines" active={col as string} dir={dir} onClick={() => handleSort('zero_lines')} right />
                  <Th label="Denial%"   col="zero_pct"   active={col as string} dir={dir} onClick={() => handleSort('zero_pct')}  right />
                  <Th label="Billed"    col="billed"     active={col as string} dir={dir} onClick={() => handleSort('billed')}    right />
                  <Th label="Collected" col="collected"  active={col as string} dir={dir} onClick={() => handleSort('collected')} right />
                  <Th label="Zero Risk" col="zero_risk"  active={col as string} dir={dir} onClick={() => handleSort('zero_risk')} right />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const rowBg =
                    row.zero_pct >= 0.4 ? 'bg-red-500/5' :
                    row.zero_pct >= 0.2 ? 'bg-yellow-500/5' : ''
                  const isSel = drillCpt === row.cpt
                  return (
                    <tr key={row.cpt}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${rowBg}
                        ${isSel ? 'outline outline-1 outline-orange-500/50' : ''}`}
                    >
                      <Td>
                        <span className="font-semibold text-orange-500">{row.cpt}</span>
                      </Td>
                      <Td className="text-zinc-400 truncate max-w-[140px]"
                          title={CPT_DESC[row.cpt] || ''}>
                        {(CPT_DESC[row.cpt] || '').substring(0, 22)}
                      </Td>
                      <Td right>
                        <span className="cursor-pointer hover:text-orange-500 transition-colors"
                          onClick={() => drill(row.cpt, 'all')}>
                          {row.lines.toLocaleString()}
                        </span>
                      </Td>
                      <Td right>
                        <span className="cursor-pointer hover:text-green-500 transition-colors"
                          onClick={() => drill(row.cpt, 'paid')}>
                          {row.paid_lines.toLocaleString()}
                        </span>
                      </Td>
                      <Td right>
                        <span className="cursor-pointer hover:text-red-500 transition-colors font-semibold"
                          onClick={() => drill(row.cpt, 'zero')}>
                          {row.zero_lines.toLocaleString()}
                        </span>
                      </Td>
                      <Td right><ZeroPctBadge pct={row.zero_pct} /></Td>
                      <Td right>
                        <span className="cursor-pointer hover:text-orange-500 transition-colors"
                          onClick={() => drill(row.cpt, 'all')}>
                          {fmtK(row.billed)}
                        </span>
                      </Td>
                      <Td right className="text-green-500">
                        <span className="cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => drill(row.cpt, 'paid')}>
                          {fmtK(row.collected)}
                        </span>
                      </Td>
                      <Td right className={row.zero_risk > 50000 ? 'text-red-500' : row.zero_risk > 10000 ? 'text-yellow-500' : 'text-zinc-400'}>
                        <span className="cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => drill(row.cpt, 'zero')}>
                          {fmtK(row.zero_risk)}
                        </span>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RIGHT: Drill-down panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!drillCpt ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <div className="text-4xl opacity-20">{'\u2B21'}</div>
            <div className="text-sm font-medium">Select a value to drill down</div>
            <div className="text-[11px]">Click any number in the summary table</div>
          </div>
        ) : (
          <DrillPanel
            key={`${drillCpt}-${drillFilter}`}
            datasetId={datasetId}
            cpt={drillCpt}
            initialFilter={drillFilter}
            summaryRow={summary.find((s) => s.cpt === drillCpt)}
            onClose={() => setDrillCpt(null)}
          />
        )}
      </div>
    </div>
  )
}
