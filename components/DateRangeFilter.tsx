'use client'

interface Props {
  startDate: string
  endDate: string
  onStartChange: (val: string) => void
  onEndChange: (val: string) => void
  onClear: () => void
}

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange, onClear }: Props) {
  const hasFilter = startDate || endDate

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-zinc-400 uppercase tracking-wide">DOS</span>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        aria-label="Start date"
        className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
          dark:border-zinc-700 rounded px-1.5 py-1 focus:outline-none focus:border-orange-500
          [color-scheme:dark]"
      />
      <span className="text-[10px] text-zinc-400">—</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        aria-label="End date"
        className="text-[10px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200
          dark:border-zinc-700 rounded px-1.5 py-1 focus:outline-none focus:border-orange-500
          [color-scheme:dark]"
      />
      {hasFilter && (
        <button
          onClick={onClear}
          aria-label="Clear date filter"
          className="text-[9px] text-zinc-400 hover:text-orange-500 transition-colors px-1"
        >
          Clear
        </button>
      )}
    </div>
  )
}
