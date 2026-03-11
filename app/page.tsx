'use client'
import { useState, useEffect } from 'react'
import TopBar from '@/components/TopBar'
import ExecTab from '@/components/ExecTab'
import PayerTab from '@/components/PayerTab'
import ProviderTab from '@/components/ProviderTab'
import WorklistTab from '@/components/WorklistTab'
import StrapTab from '@/components/StrapTab'
import RawClaimsTab from '@/components/RawClaimsTab'
import ImportModal from '@/components/ImportModal'
import type { Dataset } from '@/lib/supabase'

type Tab = 'exec' | 'payer' | 'provider' | 'worklist' | 'strap' | 'raw'

const TABS: { id: Tab; label: string }[] = [
  { id: 'exec',      label: 'Executive Summary' },
  { id: 'payer',     label: 'Payer Analysis' },
  { id: 'provider',  label: 'Provider Summary' },
  { id: 'worklist',  label: 'Zero-Pay Work List' },
  { id: 'strap',     label: 'Strapping Codes (29xxx)' },
  { id: 'raw',       label: 'All Claims' },
]

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('exec')
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [loading, setLoading] = useState(false)

  // Cross-tab drill state
  const [wlPayer,     setWlPayer]     = useState('')
  const [wlTherapist, setWlTherapist] = useState('')

  async function loadDatasets() {
    setLoading(true)
    const res = await fetch('/api/datasets')
    const data: Dataset[] = await res.json()
    setDatasets(data)
    const active = data.find((d) => d.is_active) ?? data[0] ?? null
    setActiveDataset(active)
    setLoading(false)
  }

  useEffect(() => { loadDatasets() }, [])

  function handleImportSuccess(dsId: string) {
    setShowImport(false)
    loadDatasets().then(() => {
      setDatasets((prev) => {
        const ds = prev.find((d) => d.id === dsId)
        if (ds) setActiveDataset(ds)
        return prev
      })
    })
  }

  function drillToPayer(payer: string) {
    setWlPayer(payer)
    setWlTherapist('')
    setTab('worklist')
  }

  function drillToProvider(therapist: string) {
    setWlTherapist(therapist)
    setWlPayer('')
    setTab('worklist')
  }

  function drillToCpt(cpt: string) {
    setTab('exec')
    // ExecTab handles its own state via URL; we use a small trick with key
  }

  const dsId = activeDataset?.id ?? null

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        datasets={datasets}
        activeDataset={activeDataset}
        onImport={() => setShowImport(true)}
        onRefresh={loadDatasets}
        loading={loading}
      />

      {/* Tab Bar */}
      <div className="h-9 flex items-end px-4 gap-0.5 border-b
        border-zinc-200 dark:border-zinc-800
        bg-white dark:bg-zinc-950 overflow-x-auto flex-shrink-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-[11px] whitespace-nowrap border-b-2 font-medium
              transition-colors
              ${tab === id
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {tab === 'exec'     && <ExecTab     datasetId={dsId} />}
        {tab === 'payer'    && <PayerTab    datasetId={dsId} onDrillPayer={drillToPayer} />}
        {tab === 'provider' && <ProviderTab datasetId={dsId} onDrillProvider={drillToProvider} />}
        {tab === 'worklist' && (
          <WorklistTab
            key={`${wlPayer}-${wlTherapist}`}
            datasetId={dsId}
            initialPayer={wlPayer}
            initialTherapist={wlTherapist}
          />
        )}
        {tab === 'strap'    && <StrapTab    datasetId={dsId} onDrillCpt={drillToCpt} />}
        {tab === 'raw'      && <RawClaimsTab datasetId={dsId} />}
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  )
}
