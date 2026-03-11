import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ─────────────────────────────────────────────────────────────────
export interface Claim {
  id: number
  dataset_id: string
  patient: string
  dos: string
  claim_number: string
  payer: string
  therapist: string
  facility: string
  cpt: string
  billed: number
  allowed: number
  paid: number
}

export interface Dataset {
  id: string
  label: string
  period_start: string
  period_end: string
  row_count: number
  is_active: boolean
  created_at: string
}

export interface CPTSummaryRow {
  cpt: string
  lines: number
  paid_lines: number
  zero_lines: number
  billed: number
  allowed: number
  collected: number
  zero_pct: number
  zero_risk: number
  collect_pct: number
}

export interface PayerSummaryRow {
  payer: string
  lines: number
  zero_lines: number
  billed: number
  collected: number
  zero_pct: number
  zero_risk: number
  collect_pct: number
}

export interface ProviderSummaryRow {
  therapist: string
  lines: number
  paid_lines: number
  zero_lines: number
  billed: number
  allowed: number
  collected: number
  zero_pct: number
  collect_pct: number
  primary_facility: string
}
