'use client'
import { useState, useEffect, useCallback } from 'react'
import TopBar from '@/components/TopBar'
import ExecTab from '@/components/ExecTab'
import PayerTab from '@/components/PayerTab'
import ProviderTab from '@/components/ProviderTab'
import WorklistTab from '@/components/WorklistTab'
import StrapTab from '@/components/StrapTab'
import RawClaimsTab from '@/components/RawClaimsTab'
import ImportModal from '@/components/ImportModal'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useToast } from '@/components/Toast'
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
  const { toast } = useToast()

  // Cross-tab drill state
  const [wlPayer,     setWlPayer]     = useState('')
  const [wlTherapist, setWlTherapist] = useState('')

  async function loadDatasets() {
    setLoading(true)
    try {
      const res = await fetch('/api/datasets')
      if (!res.ok) throw new Error('Failed to load datasets')
      const data: Dataset[] = await res.json()
      setDatasets(data)
      const active = data.find((d) => d.is_active) ?? data[0] ?? null
      setActiveDataset(active)
    } catch (err) {
      console.error('Failed to load datasets:', err)
      toast('error', 'Failed to load datasets. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDatasets() }, [])

  function handleImportSuccess(dsId: string) {
    setShowImport(false)
    toast('success', 'Dataset imported successfully!')
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
  }

  async function handleDeleteDataset(id: string) {
    const name = activeDataset?.label ?? 'Dataset'
    try {
      const res = await fetch('/api/datasets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      toast('success', `"${name}" deleted.`)
      await loadDatasets()
    } catch (err) {
      console.error('Failed to delete dataset:', err)
      toast('error', `Failed to delete "${name}".`)
    }
  }

  // Keyboard shortcuts: 1-6 switch tabs, Esc closes modals
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input/select/textarea
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    if (e.key === 'Escape') {
      setShowImport(false)
      return
    }

    const idx = parseInt(e.key) - 1
    if (idx >= 0 && idx < TABS.length) {
      setTab(TABS[idx].id)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const dsId = activeDataset?.id ?? null

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar
        datasets={datasets}
        activeDataset={activeDataset}
        onDatasetChange={setActiveDataset}
        onDeleteDataset={handleDeleteDataset}
        onImport={() => setShowImport(true)}
        onRefresh={loadDatasets}
        loading={loading}
      />

      {/* Tab Bar */}
      <nav aria-label="Main navigation" role="tablist"
        className="h-9 flex items-end px-4 gap-0.5 border-b
        border-zinc-200 dark:border-zinc-800
        bg-white dark:bg-zinc-950 overflow-x-auto flex-shrink-0">
        {TABS.map(({ id, label }, i) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            title={`${label} (${i + 1})`}
            className={`px-4 py-2 text-[11px] whitespace-nowrap border-b-2 font-medium
              transition-colors
              ${tab === id
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
          >
            <span className="text-[9px] opacity-40 mr-1">{i + 1}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* Content area — keyed on dsId to reset tab state on dataset switch */}
      <div className="flex-1 flex flex-col overflow-hidden" role="tabpanel">
        <ErrorBoundary key={`${tab}-${dsId}`}>
          {tab === 'exec'     && <ExecTab     key={dsId} datasetId={dsId} />}
          {tab === 'payer'    && <PayerTab    key={dsId} datasetId={dsId} onDrillPayer={drillToPayer} />}
          {tab === 'provider' && <ProviderTab key={dsId} datasetId={dsId} onDrillProvider={drillToProvider} />}
          {tab === 'worklist' && (
            <WorklistTab
              key={`${dsId}-${wlPayer}-${wlTherapist}`}
              datasetId={dsId}
              initialPayer={wlPayer}
              initialTherapist={wlTherapist}
            />
          )}
          {tab === 'strap'    && <StrapTab    key={dsId} datasetId={dsId} onDrillCpt={drillToCpt} />}
          {tab === 'raw'      && <RawClaimsTab key={dsId} datasetId={dsId} />}
        </ErrorBoundary>
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
