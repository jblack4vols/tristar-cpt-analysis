'use client'
import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  onClose: () => void
  onSuccess: (datasetId: string) => void
}

export default function ImportModal({ onClose, onSuccess }: Props) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    // Auto-generate label from filename + date
    const base = f.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ')
    setLabel(base || 'Import ' + new Date().toLocaleDateString())
  }

  async function handleUpload() {
    if (!file) return
    setStatus('uploading')
    setMessage('Parsing Excel file…')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('label', label)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || json.error) {
        setStatus('error')
        setMessage(json.error || 'Upload failed')
        return
      }
      setStatus('done')
      setMessage(`Imported ${json.row_count.toLocaleString()} claims successfully!`)
      setTimeout(() => onSuccess(json.dataset_id), 1200)
    } catch (err) {
      setStatus('error')
      setMessage(String(err))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700
        rounded-xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b
          border-zinc-200 dark:border-zinc-700">
          <div>
            <h2 className="font-bold text-base">Import New Data</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Upload a Prompt EMR CPT Revenue Report (.xlsx)
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800
            text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false)
              const f = e.dataTransfer.files[0]; if (f) handleFile(f)
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all
              ${dragging
                ? 'border-orange-500 bg-orange-500/5'
                : file
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-zinc-300 dark:border-zinc-600 hover:border-orange-400'
              }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet size={28} className="text-green-500" />
                <div className="font-medium text-sm">{file.name}</div>
                <div className="text-[10px] text-zinc-400">
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Upload size={28} />
                <div className="text-sm">Drop your .xlsx file here</div>
                <div className="text-[10px]">or click to browse</div>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {/* Label */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-wide block mb-1">
              Dataset Label
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Jan–Mar 2026"
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
                dark:border-zinc-700 rounded px-3 py-2 text-sm
                focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Status */}
          {status !== 'idle' && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5
              ${status === 'error'
                ? 'bg-red-950/40 text-red-400 border border-red-900'
                : status === 'done'
                  ? 'bg-green-950/40 text-green-400 border border-green-900'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}>
              {status === 'uploading' && <Loader2 size={14} className="animate-spin" />}
              {status === 'done' && <CheckCircle size={14} />}
              {message}
            </div>
          )}

          {/* Notes */}
          <div className="text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 leading-relaxed">
            <strong className="text-zinc-500 dark:text-zinc-300">Required format:</strong> Prompt EMR CPT Revenue Report
            with columns: Acct, Patient, DOS, Claim, Visit Type, Primary Ins, Ins Type,
            Therapist, Fin Therapist, Facility, CPT, Units, Billed, Allowed, Paid
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            disabled={status === 'uploading'}
            className="px-4 py-2 rounded text-sm text-zinc-400 hover:text-zinc-700
              dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || status === 'uploading' || status === 'done'}
            className="px-5 py-2 rounded bg-orange-500 hover:bg-orange-600
              disabled:opacity-40 disabled:cursor-not-allowed
              text-black font-semibold text-sm flex items-center gap-2 transition-colors"
          >
            {status === 'uploading' && <Loader2 size={14} className="animate-spin" />}
            {status === 'uploading' ? 'Uploading…' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
