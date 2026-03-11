import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const VALID_TYPES = ['cpt', 'payer', 'provider'] as const
type SummaryType = (typeof VALID_TYPES)[number]

const RPC_MAP: Record<SummaryType, string> = {
  cpt:      'cpt_summary',
  payer:    'payer_summary',
  provider: 'provider_summary',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const datasetId = searchParams.get('dataset_id')
    const type = (searchParams.get('type') || 'cpt') as string

    if (!datasetId) {
      return NextResponse.json({ error: 'dataset_id required' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(type as SummaryType)) {
      return NextResponse.json(
        { error: `Invalid type "${type}". Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const rpcName = RPC_MAP[type as SummaryType]
    const { data, error } = await supabase.rpc(rpcName, { p_dataset_id: datasetId })

    if (error) {
      console.error(`Summary RPC (${rpcName}) error:`, error)
      return NextResponse.json({ error: `Failed to load ${type} summary` }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Summary API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
