import { describe, it, expect } from 'vitest'
import { parseDate, toNum } from '@/lib/parsing'

describe('parseDate', () => {
  it('returns null for falsy values', () => {
    expect(parseDate(null)).toBeNull()
    expect(parseDate(undefined)).toBeNull()
    expect(parseDate('')).toBeNull()
    expect(parseDate(0)).toBeNull()
  })

  it('parses Date objects', () => {
    const d = new Date('2025-03-15')
    expect(parseDate(d)).toBe('2025-03-15')
  })

  it('parses Excel serial dates', () => {
    // 45000 is approximately 2023-02-10 in Excel serial
    const result = parseDate(45000)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('parses date strings', () => {
    expect(parseDate('2025-01-15')).toBe('2025-01-15')
  })

  it('returns null for invalid date strings', () => {
    expect(parseDate('not-a-date')).toBeNull()
  })

  it('returns null for non-date types', () => {
    expect(parseDate({})).toBeNull()
    expect(parseDate([])).toBeNull()
  })
})

describe('toNum', () => {
  it('parses numbers', () => {
    expect(toNum(42)).toBe(42)
    expect(toNum(3.14)).toBe(3.14)
  })

  it('parses number strings', () => {
    expect(toNum('42')).toBe(42)
    expect(toNum('3.14')).toBe(3.14)
  })

  it('returns 0 for null/undefined', () => {
    expect(toNum(null)).toBe(0)
    expect(toNum(undefined)).toBe(0)
  })

  it('returns 0 for non-numeric strings', () => {
    expect(toNum('abc')).toBe(0)
    expect(toNum('')).toBe(0)
  })
})
