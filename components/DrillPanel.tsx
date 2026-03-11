'use client'
import { useState, useEffect, useCallback } from 'react'
import { Td } from '@/components/Table'
import Pagination from '@/components/Pagination'
import { CPT_DESC, fmtK, fmt$ } from '@/lib/constants'
import type { CPTSummaryRow, Claim } from '@/lib/supabase'

type DrillFilter = 'all' | 'paid' | 'zero'
const PAGE_SIZE = 200

interface Props {
  datasetId: string
  cpt: string
  initialFilter: DrillFilter
  summaryRow: CPTSummaryRow | undefined
  onClose: () => void
}

export default function DrillPanel({ datasetId, cpt, initialFilter, summaryRow, onClose }: Props) {
  const [filter, setFilter] = useState<DrillFilter>(initialFilter)
  const [claims, setClaims] = useState<Claim[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [fac, setFac] = useState('')
  const [payer, setPayer] = useState('')
  const [sortCol, setSortCol] = useState('dos')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [facets, setFacets] = useState<{ facilities: string[]; payers: string[] }>({
    facilities: [],
    payers: [],
  })

  // Load facets when CPT changes
  useEffect(() => {
    fetch(`/api/claims?dataset_id=${datasetId}&cpt=${encodeURIComponent(cpt)}&page_size=5000`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return
        const facs = [...new Set((data as Claim[]).map((c) => c.facility))].sort()
        const pays = [...new Set((data as Claim[]).map((c) => c.payer))].sort()
        setFacets({ facilities: facs, payers: pays })
      })
  }, [datasetId, cpt])

  const loadClaims = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({
      dataset_id: datasetId,
      cpt,
      filter,
      page: String(page),
      page_size: String(PAGE_SIZE),
      sort: sortCol,
      dir: sortDir,
    })
    if (q)     params.set('q', q)
    if (fac)   params.set('facility', fac)
    if (payer) params.set('payer', payer)

    fetch(`/api/claims?${params}`)
      .then((r) => r.json())
      .then(({ data, count }) => {
        setClaims(Array.isArray(data) ? data : [])
        setCount(count ?? 0)
      })
      .finally(() => setLoading(false))
  }, [datasetId, cpt, filter, page, q, fac, payer, sortCol, sortDir])

  useEffect(() => { loadClaims() }, [loadClaims])
  useEffect(() => { setPage(1) }, [filter, q, fac, payer])

  function doSort(c: string) {
    if (c === sortCol) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(c); setSortDir('desc') }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)
  const tBilled  = claims.reduce((s, c) => s + c.billed, 0)
  const tPaid    = claims.reduce((s, c) => s + c.paid, 0)
  const tAllowed = claims.reduce((s, c) => s + c.allowed, 0)
  const tZero    = claims.filter((c) => c.paid === 0).length

  const COLS: [string, string, boolean][] = [
    ['patient',      'Patient',    false],
    ['dos',          'DOS',        false],
    ['claim_number', 'Claim #',    false],
    ['payer',        'Payer',      false],
    ['facility',     'Facility',   false],
    ['therapist',    'Therapist',  false],
    ['billed',       'Billed',     true ],
    ['allowed',      'Allowed',    true ],
    ['paid',         'Paid',       true ],
  ]

  return (
    <>
      {/* Drill header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0
        bg-zinc-50 dark:bg-zinc-900 flex items-center gap-3 flex-wrap">
        <div>
          <div className="font-bold text-orange-500 text-base">{cpt}</div>
          <div className="text-[10px] text-zinc-400">{CPT_DESC[cpt] || ''}</div>
        </div>
        {summaryRow && (
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Lines', val: summaryRow.lines.toLocaleString() },
              { label: 'Denial%', val: (summaryRow.zero_pct * 100).toFixed(1) + '%' },
              { label: 'Collected', val: fmtK(summaryRow.collected) },
              { label: 'Zero Risk', val: fmtK(summaryRow.zero_risk) },
            ].map(({ label, val }) => (
              <span key={label} className="text-[10px] bg-zinc-100 dark:bg-zinc-800
                border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5
                text-zinc-500 dark:text-zinc-400">
                {label}: <strong className="text-zinc-700 dark:text-zinc-300">{val}</strong>
              </span>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="ml-auto text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200
            px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 transition-colors"
          aria-label="Close drill-down"
        >
          Close
        </button>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0
        bg-white dark:bg-zinc-950 flex gap-2 items-center flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient, payer, claim #..."
          aria-label="Search claims"
          className="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2.5 py-1.5 w-52
            focus:outline-none focus:border-orange-500"
        />
        <div className="flex gap-0.5" role="group" aria-label="Filter by payment status">
          {(['all', 'paid', 'zero'] as DrillFilter[]).map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`text-[10px] px-2.5 py-1 rounded border font-medium transition-colors
                ${filter === f
                  ? 'bg-orange-500 border-orange-500 text-black'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
            >
              {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : '$0'}
            </button>
          ))}
        </div>
        <select
          value={fac}
          onChange={(e) => setFac(e.target.value)}
          aria-label="Filter by facility"
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1 focus:outline-none"
        >
          <option value="">All Facilities</option>
          {facets.facilities.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          aria-label="Filter by payer"
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1 focus:outline-none max-w-[180px]"
        >
          <option value="">All Payers</option>
          {facets.payers.map((p) => <option key={p} value={p}>{p.substring(0, 40)}</option>)}
        </select>
        <span className="ml-auto text-[10px] text-zinc-400">
          {count.toLocaleString()} claims
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">
            Loading...
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {COLS.map(([c, l, r]) => (
                  <th key={c}
                    onClick={() => doSort(c)}
                    className={`px-3 py-2 text-[9px] uppercase tracking-wide font-medium cursor-pointer
                      select-none whitespace-nowrap bg-zinc-50 dark:bg-zinc-900
                      text-zinc-500 dark:text-zinc-400 hover:text-orange-500
                      border-b border-zinc-200 dark:border-zinc-700
                      ${r ? 'text-right' : 'text-left'}`}
                  >
                    {l}
                    {sortCol === c ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
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
                  <Td right className="text-zinc-400">{c.allowed > 0 ? fmt$(c.allowed) : '\u2014'}</Td>
                  <Td right className={c.paid > 0 ? 'text-green-500' : 'text-red-500 font-semibold'}>
                    {fmt$(c.paid)}
                  </Td>
                </tr>
              ))}
              {claims.length === 0 && (
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        {[
          ['Shown', claims.length.toLocaleString(), ''],
          ['Billed', fmt$(tBilled), 'text-orange-500'],
          ['Collected', fmt$(tPaid), 'text-green-500'],
          ['Allowed', fmt$(tAllowed), ''],
          ['$0 Lines', tZero.toLocaleString(), 'text-red-500'],
          ['Collect%', tBilled > 0 ? (tPaid / tBilled * 100).toFixed(1) + '%' : '\u2014', ''],
        ].map(([label, val, cls]) => (
          <div key={label} className="flex flex-col">
            <span className="text-[9px] text-zinc-400 uppercase tracking-wide">{label}</span>
            <span className={`text-xs font-medium ${cls}`}>{val}</span>
          </div>
        ))}
      </div>
    </>
  )
}
