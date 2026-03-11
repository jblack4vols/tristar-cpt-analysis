import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Parse date from Excel serial or string
function parseDate(val: unknown): string | null {
  if (!val) return null
  if (val instanceof Date) return val.toISOString().substring(0, 10)
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    return d.toISOString().substring(0, 10)
  }
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString().substring(0, 10)
  }
  return null
}

function toNum(v: unknown): number {
  const n = parseFloat(String(v ?? 0))
  return isNaN(n) ? 0 : n
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const label = (formData.get('label') as string) || 'Import ' + new Date().toLocaleDateString()

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Read as ArrayBuffer and use xlsx
    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic import for edge-compatible usage
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })

    // Find the Detailed Data sheet
    const sheetName =
      wb.SheetNames.find((n) => n.toLowerCase().includes('detail')) ||
      wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

    if (rows.length < 2) {
      return NextResponse.json({ error: 'Sheet appears empty' }, { status: 400 })
    }

    // Column positions (0-indexed) — matches Prompt EMR CPT Revenue export
    // 0=Acct, 1=Patient, 2=DOS, 3=Claim, 4=VisitType, 5=PrimIns, 6=InsType,
    // 7=Therapist, 8=FinTherapist, 9=Facility, 10=CPT, 11=Units,
    // 12=Billed, 13=Allowed, 14=Paid
    const claims: object[] = []
    let minDos: Date | null = null
    let maxDos: Date | null = null

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] as unknown[]
      if (!r || !r[1]) continue
      const cptRaw = String(r[10] || '').trim().split(' ')[0]
      if (!cptRaw || cptRaw === 'UNKNOWN') continue

      const dosStr = parseDate(r[2])
      if (dosStr) {
        const d = new Date(dosStr)
        if (!minDos || d < minDos) minDos = d
        if (!maxDos || d > maxDos) maxDos = d
      }

      const facility = String(r[9] || '')
        .replace('Tristar PT - ', '')
        .replace('Tristar Physical Therapy - ', '')
        .trim()

      claims.push({
        patient:      String(r[1] || '').trim(),
        dos:          dosStr,
        claim_number: String(r[3] || '').trim(),
        payer:        String(r[5] || '').trim(),
        therapist:    String(r[7] || '').trim(),
        facility,
        cpt:          cptRaw,
        billed:       toNum(r[12]),
        allowed:      toNum(r[13]),
        paid:         toNum(r[14]),
      })
    }

    if (claims.length === 0) {
      return NextResponse.json({ error: 'No valid claims parsed' }, { status: 400 })
    }

    // Create dataset record
    const { data: ds, error: dsErr } = await supabase
      .from('datasets')
      .insert({
        label,
        period_start: minDos?.toISOString().substring(0, 10) ?? null,
        period_end:   maxDos?.toISOString().substring(0, 10) ?? null,
        row_count: claims.length,
        is_active: true,
      })
      .select()
      .single()

    if (dsErr || !ds) {
      return NextResponse.json({ error: dsErr?.message || 'Dataset insert failed' }, { status: 500 })
    }

    // Deactivate other datasets
    await supabase
      .from('datasets')
      .update({ is_active: false })
      .neq('id', ds.id)

    // Insert claims in batches of 500
    const BATCH = 500
    for (let i = 0; i < claims.length; i += BATCH) {
      const batch = (claims.slice(i, i + BATCH) as object[]).map((c) => ({
        ...(c as object),
        dataset_id: ds.id,
      }))
      const { error: insErr } = await supabase.from('claims').insert(batch)
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      dataset_id: ds.id,
      row_count: claims.length,
      period_start: ds.period_start,
      period_end: ds.period_end,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
