'use client'
import { useState, useEffect, useCallback } from 'react'
import { Td, PriBadge } from '@/components/Table'
import { CPT_DESC, getPriority, fmt$ } from '@/lib/constants'
import type { Claim } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  datasetId: string | null
  initialPayer?: string
  initialTherapist?: string
}

const PAGE_SIZE = 250

export default function WorklistTab({ datasetId, initialPayer, initialTherapist }: Props) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  // Filters
  const [q, setQ] = useState('')
  const [cptFilter, setCptFilter] = useState('')
  const [payerFilter, setPayerFilter] = useState(initialPayer || '')
  const [facFilter, setFacFilter] = useState('')
  const [therapistFilter, setTherapistFilter] = useState(initialTherapist || '')
  const [priFilter, setPriFilter] = useState<'' | 'H' | 'M' | 'L'>('')
  const [sortCol, setSortCol] = useState('billed')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Facets for dropdowns
  const [facets, setFacets] = useState<{
    cpts: string[], payers: string[], facilities: string[], therapists: string[]
  }>({ cpts: [], payers: [], facilities: [], therapists: [] })

  // Load facets once
  useEffect(() => {
    if (!datasetId) return
    fetch(`/api/claims?dataset_id=${datasetId}&filter=zero&page_size=5000`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (!data) return
        const d = data as Claim[]
        setFacets({
          cpts:       [...new Set(d.map((c) => c.cpt))].sort(),
          payers:     [...new Set(d.map((c) => c.payer))].sort(),
          facilities: [...new Set(d.map((c) => c.facility))].sort(),
          therapists: [...new Set(d.map((c) => c.therapist))].sort(),
        })
      })
  }, [datasetId])

  const loadClaims = useCallback(() => {
    if (!datasetId) return
    setLoading(true)
    const params = new URLSearchParams({
      dataset_id: datasetId,
      filter: 'zero',
      page: String(page),
      page_size: String(PAGE_SIZE),
      sort: sortCol,
      dir: sortDir,
    })
    if (q)              params.set('q', q)
    if (cptFilter)      params.set('cpt', cptFilter)
    if (payerFilter)    params.set('payer', payerFilter)
    if (facFilter)      params.set('facility', facFilter)
    if (therapistFilter) params.set('therapist', therapistFilter)

    fetch(`/api/claims?${params}`)
      .then((r) => r.json())
      .then(({ data, count }) => {
        // Apply priority filter client-side since it's derived
        let d: Claim[] = Array.isArray(data) ? data : []
        if (priFilter) {
          d = d.filter((c) => getPriority(c.payer)[0] === priFilter)
        }
        setClaims(d)
        setCount(count ?? 0)
      })
      .finally(() => setLoading(false))
  }, [datasetId, page, sortCol, sortDir, q, cptFilter, payerFilter, facFilter, therapistFilter, priFilter])

  useEffect(() => { loadClaims() }, [loadClaims])
  useEffect(() => { setPage(1) }, [q, cptFilter, payerFilter, facFilter, therapistFilter, priFilter])

  function doSort(c: string) {
    if (c === sortCol) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(c); setSortDir('desc') }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)
  const tBilled = claims.reduce((s, c) => s + c.billed, 0)

  function reset() {
    setQ(''); setCptFilter(''); setPayerFilter(''); setFacFilter(''); setTherapistFilter(''); setPriFilter('')
  }

  if (!datasetId) return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">No data loaded.</div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0
        bg-white dark:bg-zinc-950 flex gap-2 items-center flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient, payer, CPT, claim #…"
          className="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2.5 py-1.5 w-56
            focus:outline-none focus:border-orange-500"
        />
        <select value={cptFilter} onChange={(e) => setCptFilter(e.target.value)}
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none">
          <option value="">All CPTs</option>
          {facets.cpts.map((c) => (
            <option key={c} value={c}>{c} — {(CPT_DESC[c] || '').substring(0, 24)}</option>
          ))}
        </select>
        <select value={payerFilter} onChange={(e) => setPayerFilter(e.target.value)}
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none max-w-[180px]">
          <option value="">All Payers</option>
          {facets.payers.map((p) => <option key={p} value={p}>{p.substring(0, 42)}</option>)}
        </select>
        <select value={facFilter} onChange={(e) => setFacFilter(e.target.value)}
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none">
          <option value="">All Facilities</option>
          {facets.facilities.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={therapistFilter} onChange={(e) => setTherapistFilter(e.target.value)}
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none">
          <option value="">All Therapists</option>
          {facets.therapists.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex gap-0.5">
          {(['', 'H', 'M', 'L'] as const).map((p) => (
            <button key={p} onClick={() => setPriFilter(p)}
              className={`text-[10px] px-2 py-1 rounded border font-medium transition-colors
                ${priFilter === p
                  ? 'bg-orange-500 border-orange-500 text-black'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}>
              {p === '' ? 'All' : p === 'H' ? 'HIGH' : p === 'M' ? 'MED' : 'LOW'}
            </button>
          ))}
        </div>
        <button onClick={reset}
          className="text-[10px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700
            bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200
            transition-colors">
          Reset
        </button>
        <span className="ml-auto text-[10px] text-zinc-400">
          {count.toLocaleString()} claims · {fmt$(tBilled)} at risk
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-zinc-400 text-sm">Loading…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {[
                  ['', 'Priority', false],
                  ['patient', 'Patient', false],
                  ['dos', 'DOS', false],
                  ['cpt', 'CPT', false],
                  ['payer', 'Payer', false],
                  ['facility', 'Facility', false],
                  ['therapist', 'Therapist', false],
                  ['billed', 'Billed', true],
                  ['', 'Action', false],
                ].map(([c, l, r]) => (
                  <th key={l as string}
                    onClick={() => c && doSort(c as string)}
                    className={`px-3 py-2 text-[9px] uppercase tracking-wide font-medium
                      whitespace-nowrap bg-zinc-50 dark:bg-zinc-900
                      text-zinc-500 dark:text-zinc-400
                      border-b border-zinc-200 dark:border-zinc-700
                      ${c ? 'cursor-pointer hover:text-orange-500 select-none' : ''}
                      ${r ? 'text-right' : 'text-left'}`}
                  >
                    {l as string}
                    {c && sortCol === c ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const [pri, action] = getPriority(c.payer)
                return (
                  <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <Td><PriBadge pri={pri} /></Td>
                    <Td>{c.patient}</Td>
                    <Td className="text-zinc-400">{c.dos}</Td>
                    <Td><span className="font-semibold text-orange-500">{c.cpt}</span></Td>
                    <Td className="text-zinc-400 text-[10px] max-w-[160px] truncate" title={c.payer}>
                      {c.payer}
                    </Td>
                    <Td className="text-zinc-400 text-[10px]">{c.facility}</Td>
                    <Td className="text-[10px]">{c.therapist}</Td>
                    <Td right className="text-orange-400">{fmt$(c.billed)}</Td>
                    <Td className="text-[10px] text-zinc-400 max-w-[200px] whitespace-normal">
                      {action}
                    </Td>
                  </tr>
                )
              })}
              {claims.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-zinc-400 text-sm">
                  No claims match the current filters
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex-shrink-0
        bg-zinc-50 dark:bg-zinc-900 flex items-center gap-3">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-[10px] text-zinc-400">
          Page {page} of {Math.max(1, totalPages)} · {count.toLocaleString()} total
        </span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={14} />
        </button>
        <span className="ml-auto text-[10px] text-orange-500 font-medium">
          {fmt$(tBilled)} shown at risk
        </span>
      </div>
    </div>
  )
}
