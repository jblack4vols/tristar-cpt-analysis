'use client'
import { useState, useEffect, useCallback } from 'react'
import { Th, Td, ZeroPctBadge, useSort } from '@/components/Table'
import { CPT_DESC, fmtK, fmt$, pct } from '@/lib/constants'
import type { CPTSummaryRow, Claim } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  datasetId: string | null
}

type DrillFilter = 'all' | 'paid' | 'zero'

const PAGE_SIZE = 200

export default function ExecTab({ datasetId }: Props) {
  const [summary, setSummary] = useState<CPTSummaryRow[]>([])
  const [loading, setLoading] = useState(false)

  // Drill state
  const [drillCpt, setDrillCpt] = useState<string | null>(null)
  const [drillFilter, setDrillFilter] = useState<DrillFilter>('all')
  const [drillClaims, setDrillClaims] = useState<Claim[]>([])
  const [drillCount, setDrillCount] = useState(0)
  const [drillPage, setDrillPage] = useState(1)
  const [drillLoading, setDrillLoading] = useState(false)
  const [drillQ, setDrillQ] = useState('')
  const [drillFac, setDrillFac] = useState('')
  const [drillPayer, setDrillPayer] = useState('')
  const [drillSort, setDrillSort] = useState('dos')
  const [drillDir, setDrillDir] = useState<'asc' | 'desc'>('desc')

  // Drill facets
  const [facets, setFacets] = useState<{ facilities: string[]; payers: string[] }>({
    facilities: [],
    payers: [],
  })

  const { sorted, col, dir, handleSort } = useSort<CPTSummaryRow>(
    summary,
    'zero_risk',
    'desc'
  )

  // Load summary
  useEffect(() => {
    if (!datasetId) return
    setLoading(true)
    fetch(`/api/summary?dataset_id=${datasetId}&type=cpt`)
      .then((r) => r.json())
      .then((d) => setSummary(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [datasetId])

  // Load facets when CPT changes
  useEffect(() => {
    if (!datasetId || !drillCpt) return
    fetch(`/api/claims?dataset_id=${datasetId}&cpt=${encodeURIComponent(drillCpt)}&page_size=5000`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return
        const facs = [...new Set((data as Claim[]).map((c) => c.facility))].sort()
        const pays = [...new Set((data as Claim[]).map((c) => c.payer))].sort()
        setFacets({ facilities: facs, payers: pays })
      })
  }, [datasetId, drillCpt])

  // Load drill claims
  const loadDrill = useCallback(() => {
    if (!datasetId || !drillCpt) return
    setDrillLoading(true)
    const params = new URLSearchParams({
      dataset_id: datasetId,
      cpt: drillCpt,
      filter: drillFilter,
      page: String(drillPage),
      page_size: String(PAGE_SIZE),
      sort: drillSort,
      dir: drillDir,
    })
    if (drillQ)     params.set('q', drillQ)
    if (drillFac)   params.set('facility', drillFac)
    if (drillPayer) params.set('payer', drillPayer)

    fetch(`/api/claims?${params}`)
      .then((r) => r.json())
      .then(({ data, count }) => {
        setDrillClaims(Array.isArray(data) ? data : [])
        setDrillCount(count ?? 0)
      })
      .finally(() => setDrillLoading(false))
  }, [datasetId, drillCpt, drillFilter, drillPage, drillQ, drillFac, drillPayer, drillSort, drillDir])

  useEffect(() => {
    if (drillCpt) loadDrill()
  }, [drillCpt, drillFilter, drillPage, drillSort, drillDir, drillFac, drillPayer, loadDrill])

  // Reset page when filter changes
  useEffect(() => { setDrillPage(1) }, [drillFilter, drillQ, drillFac, drillPayer])

  function drill(cpt: string, filter: DrillFilter) {
    setDrillCpt(cpt)
    setDrillFilter(filter)
    setDrillPage(1)
    setDrillQ('')
    setDrillFac('')
    setDrillPayer('')
  }

  function dSort(c: string) {
    if (c === drillSort) setDrillDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setDrillSort(c); setDrillDir('desc') }
  }

  const totalPages = Math.ceil(drillCount / PAGE_SIZE)

  const drillSummary = drillCpt ? summary.find((s) => s.cpt === drillCpt) : null
  const tBilled   = drillClaims.reduce((s, c) => s + c.billed, 0)
  const tPaid     = drillClaims.reduce((s, c) => s + c.paid, 0)
  const tAllowed  = drillClaims.reduce((s, c) => s + c.allowed, 0)
  const tZero     = drillClaims.filter((c) => c.paid === 0).length

  if (!datasetId) return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
      No data loaded. Import a dataset to get started.
    </div>
  )

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── LEFT: CPT Summary Table ── */}
      <div className="w-[620px] min-w-[620px] border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800
          bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-400 flex-shrink-0">
          Click any value to drill into individual claims →
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
            Loading…
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

      {/* ── RIGHT: Drill-down ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!drillCpt ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <div className="text-4xl opacity-20">⬡</div>
            <div className="text-sm font-medium">Select a value to drill down</div>
            <div className="text-[11px]">Click any number in the summary table</div>
          </div>
        ) : (
          <>
            {/* Drill header */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0
              bg-zinc-50 dark:bg-zinc-900 flex items-center gap-3 flex-wrap">
              <div>
                <div className="font-bold text-orange-500 text-base">{drillCpt}</div>
                <div className="text-[10px] text-zinc-400">{CPT_DESC[drillCpt] || ''}</div>
              </div>
              {drillSummary && (
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Lines', val: drillSummary.lines.toLocaleString() },
                    { label: 'Denial%', val: (drillSummary.zero_pct * 100).toFixed(1) + '%' },
                    { label: 'Collected', val: fmtK(drillSummary.collected) },
                    { label: 'Zero Risk', val: fmtK(drillSummary.zero_risk) },
                  ].map(({ label, val }) => (
                    <span key={label} className="text-[10px] bg-zinc-100 dark:bg-zinc-800
                      border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5
                      text-zinc-500 dark:text-zinc-400">
                      {label}: <strong className="text-zinc-700 dark:text-zinc-300">{val}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0
              bg-white dark:bg-zinc-950 flex gap-2 items-center flex-wrap">
              <input
                value={drillQ}
                onChange={(e) => { setDrillQ(e.target.value); setDrillPage(1) }}
                placeholder="Search patient, payer, claim #…"
                className="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
                  dark:border-zinc-700 rounded px-2.5 py-1.5 w-52
                  focus:outline-none focus:border-orange-500"
              />
              <div className="flex gap-0.5">
                {(['all', 'paid', 'zero'] as DrillFilter[]).map((f) => (
                  <button key={f}
                    onClick={() => setDrillFilter(f)}
                    className={`text-[10px] px-2.5 py-1 rounded border font-medium transition-colors
                      ${drillFilter === f
                        ? 'bg-orange-500 border-orange-500 text-black'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }`}
                  >
                    {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : '$0'}
                  </button>
                ))}
              </div>
              <select
                value={drillFac}
                onChange={(e) => { setDrillFac(e.target.value); setDrillPage(1) }}
                className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
                  dark:border-zinc-700 rounded px-2 py-1 focus:outline-none"
              >
                <option value="">All Facilities</option>
                {facets.facilities.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={drillPayer}
                onChange={(e) => { setDrillPayer(e.target.value); setDrillPage(1) }}
                className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
                  dark:border-zinc-700 rounded px-2 py-1 focus:outline-none max-w-[180px]"
              >
                <option value="">All Payers</option>
                {facets.payers.map((p) => <option key={p} value={p}>{p.substring(0, 40)}</option>)}
              </select>
              <span className="ml-auto text-[10px] text-zinc-400">
                {drillCount.toLocaleString()} claims
              </span>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {drillLoading ? (
                <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">
                  Loading…
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      {[
                        ['patient',   'Patient',   false],
                        ['dos',       'DOS',        false],
                        ['claim_number','Claim #',  false],
                        ['payer',     'Payer',      false],
                        ['facility',  'Facility',   false],
                        ['therapist', 'Therapist',  false],
                        ['billed',    'Billed',     true ],
                        ['allowed',   'Allowed',    true ],
                        ['paid',      'Paid',       true ],
                      ].map(([c, l, r]) => (
                        <th key={c as string}
                          onClick={() => dSort(c as string)}
                          className={`px-3 py-2 text-[9px] uppercase tracking-wide font-medium cursor-pointer
                            select-none whitespace-nowrap bg-zinc-50 dark:bg-zinc-900
                            text-zinc-500 dark:text-zinc-400 hover:text-orange-500
                            border-b border-zinc-200 dark:border-zinc-700
                            ${r ? 'text-right' : 'text-left'}`}
                        >
                          {l as string}
                          {drillSort === c ? (drillDir === 'asc' ? ' ▲' : ' ▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drillClaims.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <Td>{c.patient}</Td>
                        <Td className="text-zinc-400">{c.dos}</Td>
                        <Td className="text-zinc-400 text-[10px]">{c.claim_number}</Td>
                        <Td className="text-zinc-400 text-[10px] max-w-[160px] truncate" title={c.payer}>
                          {c.payer}
                        </Td>
                        <Td className="text-zinc-400 text-[10px]">{c.facility}</Td>
                        <Td className="text-[10px]">{c.therapist}</Td>
                        <Td right>{fmt$(c.billed)}</Td>
                        <Td right className="text-zinc-400">{c.allowed > 0 ? fmt$(c.allowed) : '—'}</Td>
                        <Td right className={c.paid > 0 ? 'text-green-500' : 'text-red-500 font-semibold'}>
                          {fmt$(c.paid)}
                        </Td>
                      </tr>
                    ))}
                    {drillClaims.length === 0 && (
                      <tr><td colSpan={9} className="text-center py-10 text-zinc-400 text-sm">
                        No claims match the current filters
                      </td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination + footer */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex-shrink-0
              bg-zinc-50 dark:bg-zinc-900 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <button onClick={() => setDrillPage((p) => Math.max(1, p - 1))}
                  disabled={drillPage === 1}
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700
                    disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] text-zinc-400 px-1">
                  {drillPage} / {Math.max(1, totalPages)}
                </span>
                <button onClick={() => setDrillPage((p) => Math.min(totalPages, p + 1))}
                  disabled={drillPage >= totalPages}
                  className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700
                    disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
              {[
                ['Shown', drillClaims.length.toLocaleString(), ''],
                ['Billed', fmt$(tBilled), 'text-orange-500'],
                ['Collected', fmt$(tPaid), 'text-green-500'],
                ['Allowed', fmt$(tAllowed), ''],
                ['$0 Lines', tZero.toLocaleString(), 'text-red-500'],
                ['Collect%', tBilled > 0 ? (tPaid / tBilled * 100).toFixed(1) + '%' : '—', ''],
              ].map(([label, val, cls]) => (
                <div key={label as string} className="flex flex-col">
                  <span className="text-[9px] text-zinc-400 uppercase tracking-wide">{label}</span>
                  <span className={`text-xs font-medium ${cls}`}>{val}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
