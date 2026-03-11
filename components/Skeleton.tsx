'use client'

interface SkeletonRowProps {
  cols: number
  rows?: number
}

export function SkeletonTable({ cols, rows = 8 }: SkeletonRowProps) {
  return (
    <div className="w-full" role="status" aria-label="Loading">
      {/* Header */}
      <div className="flex gap-3 px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-700
        bg-zinc-50 dark:bg-zinc-900">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 rounded flex-1" style={{ maxWidth: i === 0 ? 140 : 80 }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 px-3 py-3 border-b border-zinc-100 dark:border-zinc-800">
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-3 rounded flex-1"
              style={{
                maxWidth: i === 0 ? 140 : 80,
                animationDelay: `${(r * cols + i) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading data...</span>
    </div>
  )
}

export function SkeletonKPIs({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200
          dark:border-zinc-800 rounded-lg px-4 py-3">
          <div className="skeleton h-2 w-16 mb-2 rounded" />
          <div className="skeleton h-6 w-20 rounded" style={{ animationDelay: `${i * 100}ms` }} />
        </div>
      ))}
      <span className="sr-only">Loading data...</span>
    </div>
  )
}
