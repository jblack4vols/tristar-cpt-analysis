'use client'
import { useState, useEffect } from 'react'
import { Th, Td, ZeroPctBadge, useSort } from '@/components/Table'
import { CPT_DESC, fmtK } from '@/lib/constants'
import type { CPTSummaryRow } from '@/lib/supabase'

interface Props {
  datasetId: string | null
  onDrillCpt: (cpt: string) => void
}

export default function StrapTab({ datasetId, onDrillCpt }: Props) {
  const [summary, setSummary] = useState<CPTSummaryRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!datasetId) return
    setLoading(true)
    fetch(`/api/summary?dataset_id=${datasetId}&type=cpt`)
      .then((r) => r.json())
      .then((d) => {
        const strap = (Array.isArray(d) ? d : []).filter(
          (r: CPTSummaryRow) => r.cpt.startsWith('29') && !r.cpt.includes(' ')
        )
        setSummary(strap)
      })
      .finally(() => setLoading(false))
  }, [datasetId])

  const { sorted, col, dir, handleSort } = useSort<CPTSummaryRow>(summary, 'billed', 'desc')

  if (!datasetId) return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">No data loaded.</div>
  )

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* Audit banner */}
      <div className="flex items-start gap-3 bg-red-950/30 border border-red-900/50
        rounded-lg px-4 py-3 mb-4 text-sm">
        <span className="text-red-400 text-lg leading-none">⚠</span>
        <div>
          <div className="font-semibold text-red-400 mb-0.5">Active BCBS TN Post-Payment Audit</div>
          <div className="text-[11px] text-zinc-400 leading-relaxed">
            CPT 29530 (Knee Strapping) is under active audit. BCBS OOS Plans is the #1 denier.
            Cross-reference zero-paid lines with the bcbs-recon-generator audit tracker before responding.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Loading…</div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                <Th label="CPT"       col="cpt"        active={col as string} dir={dir} onClick={() => handleSort('cpt')} />
                <Th label="Description" col="cpt"      active="" dir="asc" onClick={() => {}} />
                <Th label="Lines"     col="lines"      active={col as string} dir={dir} onClick={() => handleSort('lines')}      right />
                <Th label="$0 Lines"  col="zero_lines" active={col as string} dir={dir} onClick={() => handleSort('zero_lines')} right />
                <Th label="Denial%"   col="zero_pct"   active={col as string} dir={dir} onClick={() => handleSort('zero_pct')}  right />
                <Th label="Billed"    col="billed"     active={col as string} dir={dir} onClick={() => handleSort('billed')}    right />
                <Th label="Collected" col="collected"  active={col as string} dir={dir} onClick={() => handleSort('collected')} right />
                <Th label="Collect%"  col="collect_pct" active={col as string} dir={dir} onClick={() => handleSort('collect_pct')} right />
                <Th label="Zero Risk" col="zero_risk"  active={col as string} dir={dir} onClick={() => handleSort('zero_risk')} right />
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const isAudit = row.cpt === '29530'
                return (
                  <tr key={row.cpt}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50
                      ${isAudit ? 'ring-1 ring-orange-500/40 bg-orange-500/5' : ''}
                      ${row.zero_pct >= 0.4 ? 'bg-red-500/5' : row.zero_pct >= 0.2 ? 'bg-yellow-500/5' : ''}`}>
                    <Td>
                      <span className="font-semibold text-orange-500 cursor-pointer hover:underline"
                        onClick={() => onDrillCpt(row.cpt)}>
                        {row.cpt}
                      </span>
                      {isAudit && (
                        <span className="ml-2 text-[9px] text-red-400 border border-red-800
                          rounded px-1 py-0.5">BCBS AUDIT</span>
                      )}
                    </Td>
                    <Td className="text-zinc-400 text-[10px]">{CPT_DESC[row.cpt] || ''}</Td>
                    <Td right>{row.lines.toLocaleString()}</Td>
                    <Td right className="text-red-500 font-semibold">
                      <span className="cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => onDrillCpt(row.cpt)}>
                        {row.zero_lines.toLocaleString()}
                      </span>
                    </Td>
                    <Td right><ZeroPctBadge pct={row.zero_pct} /></Td>
                    <Td right>{fmtK(row.billed)}</Td>
                    <Td right className="text-green-500">{fmtK(row.collected)}</Td>
                    <Td right>{(row.collect_pct * 100).toFixed(1)}%</Td>
                    <Td right className={row.zero_risk > 10000 ? 'text-red-500' : 'text-zinc-400'}>
                      {fmtK(row.zero_risk)}
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
