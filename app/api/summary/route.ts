import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const datasetId = searchParams.get('dataset_id')
  const type = searchParams.get('type') || 'cpt'

  if (!datasetId) return NextResponse.json({ error: 'dataset_id required' }, { status: 400 })

  if (type === 'cpt') {
    const { data, error } = await supabase.rpc('cpt_summary', { p_dataset_id: datasetId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (type === 'payer') {
    const { data, error } = await supabase.rpc('payer_summary', { p_dataset_id: datasetId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (type === 'provider') {
    const { data, error } = await supabase.rpc('provider_summary', { p_dataset_id: datasetId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'unknown type' }, { status: 400 })
}
