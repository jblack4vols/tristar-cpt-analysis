'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  label?: string
}

export default function Pagination({ page, totalPages, onPageChange, label }: Props) {
  const safeTotalPages = Math.max(1, totalPages)

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-[10px] text-zinc-400 px-1">
        {label
          ? `Page ${page} of ${safeTotalPages} ${label}`
          : `${page} / ${safeTotalPages}`}
      </span>
      <button
        onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
        disabled={page >= safeTotalPages}
        aria-label="Next page"
        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700
          disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
