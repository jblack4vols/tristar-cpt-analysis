// Pure parsing utilities used by the upload route — testable without Supabase

// Parse date from Excel serial or string
export function parseDate(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().substring(0, 10)
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    if (isNaN(d.getTime())) return null
    return d.toISOString().substring(0, 10)
  }
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString().substring(0, 10)
  }
  return null
}

export function toNum(v: unknown): number {
  const n = parseFloat(String(v ?? 0))
  return isNaN(n) ? 0 : n
}
