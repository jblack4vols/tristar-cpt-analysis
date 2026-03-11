import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const datasetId  = sp.get('dataset_id')
  const cpt        = sp.get('cpt')
  const payer      = sp.get('payer')
  const facility   = sp.get('facility')
  const therapist  = sp.get('therapist')
  const filter     = sp.get('filter')   // 'paid' | 'zero' | 'all'
  const q          = sp.get('q')
  const page       = parseInt(sp.get('page') || '1')
  const pageSize   = parseInt(sp.get('page_size') || '200')
  const sortCol    = sp.get('sort') || 'dos'
  const sortDir    = sp.get('dir') === 'asc' ? false : true  // ascending = false for desc

  if (!datasetId) return NextResponse.json({ error: 'dataset_id required' }, { status: 400 })

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
    query = query.or(
      `patient.ilike.%${q}%,claim_number.ilike.%${q}%,payer.ilike.%${q}%,therapist.ilike.%${q}%`
    )
  }

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  query = query
    .order(sortCol as string, { ascending: !sortDir })
    .range(from, to)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count, page, page_size: pageSize })
}
