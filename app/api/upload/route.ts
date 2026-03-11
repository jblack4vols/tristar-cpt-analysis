import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseDate, toNum } from '@/lib/parsing'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]
const EXPECTED_MIN_COLUMNS = 15

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const label = (formData.get('label') as string) || 'Import ' + new Date().toLocaleDateString()

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an .xlsx or .xls file.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 50 MB.` },
        { status: 400 }
      )
    }

    // Read as ArrayBuffer and use xlsx
    const buffer = Buffer.from(await file.arrayBuffer())

    // Dynamic import for edge-compatible usage
    const XLSX = await import('xlsx')
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })

    if (wb.SheetNames.length === 0) {
      return NextResponse.json({ error: 'Workbook contains no sheets' }, { status: 400 })
    }

    // Find the Detailed Data sheet
    const sheetName =
      wb.SheetNames.find((n) => n.toLowerCase().includes('detail')) ||
      wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

    if (rows.length < 2) {
      return NextResponse.json({ error: 'Sheet appears empty — need at least a header row and one data row' }, { status: 400 })
    }

    // Validate column count (ensure the file matches expected Prompt EMR format)
    const headerRow = rows[0] as unknown[]
    if (!headerRow || headerRow.length < EXPECTED_MIN_COLUMNS) {
      return NextResponse.json(
        {
          error: `Expected at least ${EXPECTED_MIN_COLUMNS} columns (Prompt EMR CPT Revenue format), but found ${headerRow?.length ?? 0}. Please verify you're uploading the correct report.`,
        },
        { status: 400 }
      )
    }

    // Column positions (0-indexed) — matches Prompt EMR CPT Revenue export
    // 0=Acct, 1=Patient, 2=DOS, 3=Claim, 4=VisitType, 5=PrimIns, 6=InsType,
    // 7=Therapist, 8=FinTherapist, 9=Facility, 10=CPT, 11=Units,
    // 12=Billed, 13=Allowed, 14=Paid
    const claims: object[] = []
    let minDos: Date | null = null
    let maxDos: Date | null = null
    let skippedRows = 0

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] as unknown[]
      if (!r || !r[1]) { skippedRows++; continue }

      const cptRaw = String(r[10] || '').trim().split(/\s+/)[0]
      if (!cptRaw || cptRaw === 'UNKNOWN') { skippedRows++; continue }

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
      return NextResponse.json(
        { error: `No valid claims parsed (${skippedRows} rows skipped). Verify the file format matches Prompt EMR CPT Revenue Report.` },
        { status: 400 }
      )
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
      console.error('Dataset insert error:', dsErr)
      return NextResponse.json(
        { error: 'Failed to create dataset record. Please try again.' },
        { status: 500 }
      )
    }

    // Deactivate other datasets
    const { error: deactivateErr } = await supabase
      .from('datasets')
      .update({ is_active: false })
      .neq('id', ds.id)

    if (deactivateErr) {
      console.error('Dataset deactivation error:', deactivateErr)
    }

    // Insert claims in batches of 500
    const BATCH = 500
    for (let i = 0; i < claims.length; i += BATCH) {
      const batch = (claims.slice(i, i + BATCH) as object[]).map((c) => ({
        ...(c as object),
        dataset_id: ds.id,
      }))
      const { error: insErr } = await supabase.from('claims').insert(batch)
      if (insErr) {
        console.error(`Batch insert error at row ${i}:`, insErr)
        // Clean up the partially-inserted dataset
        await supabase.from('claims').delete().eq('dataset_id', ds.id)
        await supabase.from('datasets').delete().eq('id', ds.id)
        return NextResponse.json(
          { error: `Failed to insert claims (batch starting at row ${i + 1}). Import rolled back.` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      dataset_id: ds.id,
      row_count: claims.length,
      skipped_rows: skippedRows,
      period_start: ds.period_start,
      period_end: ds.period_end,
    })
  } catch (err) {
    console.error('Upload error:', err)
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    )
  }
}
