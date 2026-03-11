'use client'
import { useState, useEffect, useCallback } from 'react'
import { Td } from '@/components/Table'
import Pagination from '@/components/Pagination'
import { SkeletonTable } from '@/components/Skeleton'
import { CPT_DESC, fmt$ } from '@/lib/constants'
import { exportCSV } from '@/lib/export'
import { Download } from 'lucide-react'
import type { Claim } from '@/lib/supabase'

interface Props {
  datasetId: string | null
}

const PAGE_SIZE = 200

export default function RawClaimsTab({ datasetId }: Props) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [cptFilter, setCptFilter] = useState('')
  const [payerFilter, setPayerFilter] = useState('')
  const [facFilter, setFacFilter] = useState('')
  const [therapistFilter, setTherapistFilter] = useState('')
  const [filterPaid, setFilterPaid] = useState<'' | 'paid' | 'zero'>('')
  const [sortCol, setSortCol] = useState('dos')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [facets, setFacets] = useState<{
    cpts: string[], payers: string[], facilities: string[], therapists: string[]
  }>({ cpts: [], payers: [], facilities: [], therapists: [] })

  // Load facets
  useEffect(() => {
    if (!datasetId) return
    fetch(`/api/claims?dataset_id=${datasetId}&page_size=5000`)
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

  const load = useCallback(() => {
    if (!datasetId) return
    setLoading(true)
    const params = new URLSearchParams({
      dataset_id: datasetId,
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
    if (filterPaid)     params.set('filter', filterPaid)

    fetch(`/api/claims?${params}`)
      .then((r) => r.json())
      .then(({ data, count }) => {
        setClaims(Array.isArray(data) ? data : [])
        setCount(count ?? 0)
      })
      .finally(() => setLoading(false))
  }, [datasetId, page, sortCol, sortDir, q, cptFilter, payerFilter, facFilter, therapistFilter, filterPaid])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [q, cptFilter, payerFilter, facFilter, therapistFilter, filterPaid])

  function doSort(c: string) {
    if (c === sortCol) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(c); setSortDir('desc') }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE)
  const tBilled  = claims.reduce((s, c) => s + c.billed, 0)
  const tPaid    = claims.reduce((s, c) => s + c.paid, 0)
  const tAllowed = claims.reduce((s, c) => s + c.allowed, 0)

  if (!datasetId) return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">No data loaded.</div>
  )

  const cols = [
    ['patient',      'Patient',    false],
    ['dos',          'DOS',        false],
    ['claim_number', 'Claim #',    false],
    ['cpt',          'CPT',        false],
    ['payer',        'Payer',      false],
    ['facility',     'Facility',   false],
    ['therapist',    'Therapist',  false],
    ['billed',       'Billed',     true ],
    ['allowed',      'Allowed',    true ],
    ['paid',         'Paid',       true ],
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0
        bg-white dark:bg-zinc-950 flex gap-2 items-center flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search patient, payer, claim #..."
          aria-label="Search all claims"
          className="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2.5 py-1.5 w-52
            focus:outline-none focus:border-orange-500"
        />
        <select value={cptFilter} onChange={(e) => setCptFilter(e.target.value)}
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none">
          <option value="">All CPTs</option>
          {facets.cpts.map((c) => (
            <option key={c} value={c}>{c} — {(CPT_DESC[c] || '').substring(0, 22)}</option>
          ))}
        </select>
        <select value={payerFilter} onChange={(e) => setPayerFilter(e.target.value)}
          className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
            dark:border-zinc-700 rounded px-2 py-1.5 focus:outline-none max-w-[170px]">
          <option value="">All Payers</option>
          {facets.payers.map((p) => <option key={p} value={p}>{p.substring(0, 40)}</option>)}
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
          {(['', 'paid', 'zero'] as const).map((f) => (
            <button key={f} onClick={() => setFilterPaid(f)}
              className={`text-[10px] px-2.5 py-1 rounded border font-medium transition-colors
                ${filterPaid === f
                  ? 'bg-orange-500 border-orange-500 text-black'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}>
              {f === '' ? 'All' : f === 'paid' ? 'Paid' : '$0 Only'}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCSV(claims, 'all-claims', [
            { key: 'patient', label: 'Patient' }, { key: 'dos', label: 'DOS' },
            { key: 'claim_number', label: 'Claim #' }, { key: 'cpt', label: 'CPT' },
            { key: 'payer', label: 'Payer' }, { key: 'facility', label: 'Facility' },
            { key: 'therapist', label: 'Therapist' }, { key: 'billed', label: 'Billed' },
            { key: 'allowed', label: 'Allowed' }, { key: 'paid', label: 'Paid' },
          ])}
          disabled={claims.length === 0}
          aria-label="Export claims to CSV"
          className="text-[10px] px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700
            bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors
            flex items-center gap-1"
        >
          <Download size={10} /> Export
        </button>
        <span className="ml-auto text-[10px] text-zinc-400">{count.toLocaleString()} claims</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <SkeletonTable cols={10} rows={12} />
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                {cols.map(([c, l, r]) => (
                  <th key={c as string}
                    onClick={() => doSort(c as string)}
                    className={`px-3 py-2 text-[9px] uppercase tracking-wide font-medium
                      cursor-pointer select-none whitespace-nowrap
                      bg-zinc-50 dark:bg-zinc-900
                      text-zinc-500 dark:text-zinc-400 hover:text-orange-500
                      border-b border-zinc-200 dark:border-zinc-700
                      ${r ? 'text-right' : 'text-left'}`}
                  >
                    {l as string}
                    {sortCol === c ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <Td className="font-medium">{c.patient}</Td>
                  <Td className="text-zinc-400">{c.dos}</Td>
                  <Td className="text-zinc-400 text-[10px]">{c.claim_number}</Td>
                  <Td>
                    <span className="font-semibold text-orange-500">{c.cpt}</span>
                    <span className="ml-1.5 text-[10px] text-zinc-400">{(CPT_DESC[c.cpt] || '').substring(0, 18)}</span>
                  </Td>
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
              {claims.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-zinc-400 text-sm">
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
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          label={`\u00B7 ${count.toLocaleString()} total`}
        />
        {[
          ['Billed', fmt$(tBilled), 'text-orange-500'],
          ['Collected', fmt$(tPaid), 'text-green-500'],
          ['Allowed', fmt$(tAllowed), ''],
        ].map(([label, val, cls]) => (
          <div key={label as string} className="flex flex-col ml-2">
            <span className="text-[9px] text-zinc-400 uppercase tracking-wide">{label}</span>
            <span className={`text-xs font-medium ${cls}`}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
