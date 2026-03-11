import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Datasets fetch error:', error)
      return NextResponse.json({ error: 'Failed to load datasets' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Datasets API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Dataset id required' }, { status: 400 })
    }

    // Delete related claims first
    const { error: claimsErr } = await supabase.from('claims').delete().eq('dataset_id', id)
    if (claimsErr) {
      console.error('Claims deletion error:', claimsErr)
      return NextResponse.json({ error: 'Failed to delete dataset claims' }, { status: 500 })
    }

    // Delete the dataset
    const { error: dsErr } = await supabase.from('datasets').delete().eq('id', id)
    if (dsErr) {
      console.error('Dataset deletion error:', dsErr)
      return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Dataset delete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
