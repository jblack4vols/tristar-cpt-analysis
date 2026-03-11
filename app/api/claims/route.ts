import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ALLOWED_SORT_COLS = new Set([
  'patient', 'dos', 'claim_number', 'payer', 'facility', 'therapist',
  'cpt', 'billed', 'allowed', 'paid',
])

const MAX_PAGE_SIZE = 5000

// Sanitize search input for use in Supabase .or() filters
function sanitizeSearch(input: string): string {
  return input.replace(/[%_\\,().*]/g, '')
}

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams
    const datasetId  = sp.get('dataset_id')
    const cpt        = sp.get('cpt')
    const payer      = sp.get('payer')
    const facility   = sp.get('facility')
    const therapist  = sp.get('therapist')
    const filter     = sp.get('filter')   // 'paid' | 'zero' | 'all'
    const q          = sp.get('q')
    const page       = Math.max(1, parseInt(sp.get('page') || '1') || 1)
    const pageSize   = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(sp.get('page_size') || '200') || 200))
    const sortCol    = sp.get('sort') || 'dos'
    const sortDir    = sp.get('dir') === 'asc' ? false : true  // ascending = false for desc

    if (!datasetId) {
      return NextResponse.json({ error: 'dataset_id required' }, { status: 400 })
    }

    // Validate sort column to prevent injection
    const safeSortCol = ALLOWED_SORT_COLS.has(sortCol) ? sortCol : 'dos'

    let query = supabase
      .from('claims')
      .select('*', { count: 'exact' })
      .eq('dataset_id', datasetId)

    if (cpt)       query = query.eq('cpt', cpt)
    if (payer)     query = query.eq('payer', payer)
    if (facility)  query = query.eq('facility', facility)
    if (therapist) query = query.eq('therapist', therapist)
    if (filter === 'paid') query = query.gt('paid', 0)
    if (filter === 'zero') query = query.eq('paid', 0)

    if (q) {
      const safe = sanitizeSearch(q)
      if (safe.length > 0) {
        query = query.or(
          `patient.ilike.%${safe}%,claim_number.ilike.%${safe}%,payer.ilike.%${safe}%,therapist.ilike.%${safe}%`
        )
      }
    }

    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    query = query
      .order(safeSortCol, { ascending: !sortDir })
      .range(from, to)

    const { data, error, count } = await query
    if (error) {
      console.error('Claims query error:', error)
      return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 })
    }

    return NextResponse.json({ data, count, page, page_size: pageSize })
  } catch (err) {
    console.error('Claims API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
