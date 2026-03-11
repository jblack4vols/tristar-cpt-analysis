'use client'
import { useState } from 'react'
import { Sun, Moon, Upload, RefreshCw, Trash2 } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import ConfirmDialog from '@/components/ConfirmDialog'
import type { Dataset } from '@/lib/supabase'

interface Props {
  datasets: Dataset[]
  activeDataset: Dataset | null
  onDatasetChange: (ds: Dataset) => void
  onDeleteDataset: (id: string) => void
  onImport: () => void
  onRefresh: () => void
  loading: boolean
}

export default function TopBar({ datasets, activeDataset, onDatasetChange, onDeleteDataset, onImport, onRefresh, loading }: Props) {
  const { theme, toggle } = useTheme()
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <header className="h-12 flex items-center px-4 gap-3 border-b
      bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 flex-shrink-0"
      role="banner">
      {/* Logo */}
      <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center
        font-black text-black text-sm flex-shrink-0" aria-hidden="true">T</div>

      <span className="font-bold text-sm tracking-tight hidden sm:block">
        Tristar PT <span className="text-zinc-400 dark:text-zinc-500 font-normal">— CPT Analytics</span>
      </span>

      {/* Period badge */}
      {activeDataset && (
        <span className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
          rounded px-2 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
          {activeDataset.label} · {activeDataset.row_count?.toLocaleString()} claims
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Dataset selector */}
        {datasets.length > 1 && (
          <select
            value={activeDataset?.id ?? ''}
            onChange={(e) => {
              const ds = datasets.find((d) => d.id === e.target.value)
              if (ds) onDatasetChange(ds)
            }}
            aria-label="Select dataset"
            className="text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200
              dark:border-zinc-700 rounded px-2 py-1 text-zinc-600 dark:text-zinc-300">
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        )}

        {/* Delete dataset */}
        {activeDataset && datasets.length > 0 && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30
              text-zinc-400 hover:text-red-500 transition-colors"
            title="Delete current dataset"
            aria-label="Delete current dataset"
          >
            <Trash2 size={14} />
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800
            text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          title="Refresh"
          aria-label="Refresh data"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={toggle}
          className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800
            text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          onClick={onImport}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600
            text-black font-semibold text-[11px] px-3 py-1.5 rounded transition-colors"
        >
          <Upload size={12} />
          Import Data
        </button>
      </div>

      {confirmDelete && activeDataset && (
        <ConfirmDialog
          title="Delete Dataset"
          message={`Are you sure you want to delete "${activeDataset.label}"? This will permanently remove ${activeDataset.row_count?.toLocaleString() ?? 0} claims. This action cannot be undone.`}
          confirmLabel="Delete Dataset"
          onConfirm={() => {
            setConfirmDelete(false)
            onDeleteDataset(activeDataset.id)
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </header>
  )
}
