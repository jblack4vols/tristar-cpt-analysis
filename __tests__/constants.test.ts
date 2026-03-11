import { describe, it, expect } from 'vitest'
import { CPT_DESC, getPriority, fmt$, fmtK, pct } from '@/lib/constants'

describe('fmt$', () => {
  it('formats zero', () => {
    expect(fmt$(0)).toBe('$0.00')
  })

  it('formats small values', () => {
    expect(fmt$(12.5)).toBe('$12.50')
  })

  it('formats values with thousands separator', () => {
    expect(fmt$(1234.56)).toBe('$1,234.56')
  })

  it('formats large values', () => {
    expect(fmt$(1234567.89)).toBe('$1,234,567.89')
  })
})

describe('fmtK', () => {
  it('formats values under $1K as dollars', () => {
    expect(fmtK(500)).toBe('$500.00')
  })

  it('formats values >= $1K with K suffix', () => {
    expect(fmtK(1500)).toBe('$2K')
  })

  it('formats values >= $1M with M suffix', () => {
    expect(fmtK(1500000)).toBe('$1.5M')
  })
})

describe('pct', () => {
  it('calculates percentage', () => {
    expect(pct(50, 200)).toBe('25.0%')
  })

  it('returns dash for zero denominator', () => {
    expect(pct(50, 0)).toBe('—')
  })

  it('handles zero numerator', () => {
    expect(pct(0, 100)).toBe('0.0%')
  })
})

describe('getPriority', () => {
  it('returns HIGH for Tricare', () => {
    const [pri, action] = getPriority('Tricare West')
    expect(pri).toBe('H')
    expect(action).toContain('Tricare')
  })

  it('returns HIGH for Medicare', () => {
    const [pri] = getPriority('Medicare Part B')
    expect(pri).toBe('H')
  })

  it('returns MED for UnitedHealthcare', () => {
    const [pri] = getPriority('UnitedHealthcare Choice Plus')
    expect(pri).toBe('M')
  })

  it('returns LOW for unknown payers', () => {
    const [pri, action] = getPriority('Some Random Insurance Co')
    expect(pri).toBe('L')
    expect(action).toContain('Review EOB')
  })
})

describe('CPT_DESC', () => {
  it('has descriptions for common PT codes', () => {
    expect(CPT_DESC['97110']).toBe('Therapeutic Exercise')
    expect(CPT_DESC['97140']).toBe('Manual Therapy')
    expect(CPT_DESC['97161']).toBe('PT Eval – Low Complexity')
  })

  it('returns undefined for unknown codes', () => {
    expect(CPT_DESC['00000']).toBeUndefined()
  })
})
