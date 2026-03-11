// CSV export utility — downloads data as a .csv file

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportCSV(
  data: any[],
  filename: string,
  columns?: { key: string; label: string }[]
) {
  if (data.length === 0) return

  const cols = columns ?? Object.keys(data[0]).map((k) => ({ key: k, label: k }))

  const header = cols.map((c) => escapeCSV(c.label)).join(',')
  const rows = data.map((row) =>
    cols.map((c) => escapeCSV(String(row[c.key] ?? ''))).join(',')
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()

  URL.revokeObjectURL(url)
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}
