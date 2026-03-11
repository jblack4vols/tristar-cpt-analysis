'use client'
import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export type SortDir = 'asc' | 'desc'

export function useSort<T>(
  data: T[],
  defaultCol: keyof T,
  defaultDir: SortDir = 'desc'
) {
  const [col, setCol] = useState<keyof T>(defaultCol)
  const [dir, setDir] = useState<SortDir>(defaultDir)

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const va = a[col] as unknown
      const vb = b[col] as unknown
      if (typeof va === 'number' && typeof vb === 'number') {
        return dir === 'asc' ? va - vb : vb - va
      }
      const sa = String(va ?? '').toLowerCase()
      const sb = String(vb ?? '').toLowerCase()
      return dir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
    })
  }, [data, col, dir])

  function handleSort(c: keyof T) {
    if (c === col) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setCol(c); setDir('desc') }
  }

  return { sorted, col, dir, handleSort }
}

interface SortIconProps {
  col: string
  active: string
  dir: SortDir
}
export function SortIcon({ col, active, dir }: SortIconProps) {
  if (col !== active) return <ChevronsUpDown size={10} className="opacity-30" />
  return dir === 'asc'
    ? <ChevronUp size={10} className="text-orange-500" />
    : <ChevronDown size={10} className="text-orange-500" />
}

interface ThProps {
  label: string
  col: string
  active: string
  dir: SortDir
  onClick: () => void
  right?: boolean
  className?: string
}
export function Th({ label, col, active, dir, onClick, right, className = '' }: ThProps) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 text-[9px] uppercase tracking-wide font-medium cursor-pointer
        select-none whitespace-nowrap group
        bg-zinc-50 dark:bg-zinc-900
        text-zinc-500 dark:text-zinc-400
        hover:text-orange-500 dark:hover:text-orange-400
        border-b border-zinc-200 dark:border-zinc-700
        ${right ? 'text-right' : 'text-left'} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {right && <SortIcon col={col} active={active} dir={dir} />}
        {label}
        {!right && <SortIcon col={col} active={active} dir={dir} />}
      </span>
    </th>
  )
}

interface TdProps {
  children?: React.ReactNode
  right?: boolean
  className?: string
  onClick?: () => void
  title?: string
}
export function Td({ children, right, className = '', onClick, title }: TdProps) {
  return (
    <td
      title={title}
      onClick={onClick}
      className={`px-3 py-1.5 text-[11px]
        border-b border-zinc-100 dark:border-zinc-800
        ${right ? 'text-right' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
    >
      {children}
    </td>
  )
}

export function ZeroPctBadge({ pct }: { pct: number }) {
  if (pct >= 0.4)
    return <span className="text-red-500 font-semibold">{(pct * 100).toFixed(1)}%</span>
  if (pct >= 0.2)
    return <span className="text-yellow-500 font-semibold">{(pct * 100).toFixed(1)}%</span>
  return <span className="text-zinc-400">{(pct * 100).toFixed(1)}%</span>
}

export function PriBadge({ pri }: { pri: 'H' | 'M' | 'L' }) {
  const map = {
    H: 'bg-red-950 text-red-400 border-red-900 dark:bg-red-950/50',
    M: 'bg-yellow-950 text-yellow-400 border-yellow-900 dark:bg-yellow-950/50',
    L: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }
  const labels = { H: 'HIGH', M: 'MED', L: 'LOW' }
  return (
    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${map[pri]}`}>
      {labels[pri]}
    </span>
  )
}
