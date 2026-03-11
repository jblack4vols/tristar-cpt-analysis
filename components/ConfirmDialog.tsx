'use client'
import { AlertTriangle } from 'lucide-react'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700
        rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 id="confirm-title" className="font-bold text-sm mb-1">{title}</h3>
              <p className="text-[12px] text-zinc-400 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded text-sm text-zinc-400 hover:text-zinc-700
              dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded bg-red-500 hover:bg-red-600
              text-white font-semibold text-sm transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
