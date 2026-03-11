export const CPT_DESC: Record<string, string> = {
  '20560': 'Needle Tenotomy, 1-2 Tendons',
  '20561': 'Needle Tenotomy, 3+ Tendons',
  '29200': 'Strapping – Thorax',
  '29240': 'Strapping – Shoulder',
  '29260': 'Strapping – Elbow/Wrist',
  '29280': 'Strapping – Hand/Finger',
  '29520': 'Strapping – Hip',
  '29530': 'Strapping – Knee',
  '29540': 'Strapping – Ankle/Foot',
  '29550': 'Strapping – Toes',
  '95992': 'Canalith Repositioning',
  '97012': 'Traction, Mechanical',
  '97014': 'E-Stim, Unattended',
  '97016': 'Vasopneumatic Device',
  '97018': 'Paraffin Bath',
  '97026': 'Infrared',
  '97035': 'Ultrasound',
  '97110': 'Therapeutic Exercise',
  '97112': 'Neuromuscular Reeducation',
  '97113': 'Aquatic Therapy',
  '97116': 'Gait Training',
  '97139': 'Unlisted PT Procedure',
  '97140': 'Manual Therapy',
  '97150': 'Therapeutic Activities, Group',
  '97161': 'PT Eval – Low Complexity',
  '97162': 'PT Eval – Moderate Complexity',
  '97163': 'PT Eval – High Complexity',
  '97164': 'PT Re-Eval',
  '97165': 'OT Eval – Low Complexity',
  '97166': 'OT Eval – Moderate Complexity',
  '97168': 'OT Re-Eval',
  '97530': 'Therapeutic Activities',
  '97535': 'Self-Care / Home Mgmt Training',
  '97545': 'Work Hardening, Initial 2hr',
  '97546': "Work Hardening, Add'l 1hr",
  '97597': 'Debridement, Open Wound',
  '97598': "Debridement, Add'l 20cm²",
  '97750': 'Physical Performance Test',
  'G0283': 'E-Stim, Unattended (Medicare)',
}

export type Priority = 'H' | 'M' | 'L'

const PAYER_PRIORITY_MAP: [string, Priority, string][] = [
  ['Tricare', 'H', 'Pull EOBs — Tricare coverage uncertain; check modifier 59/XS and NPI enrollment'],
  ['Medicare', 'H', 'LCD/NCD denial likely — verify dx code, frequency limits, documentation'],
  ['Blue Cross Blue Shield of Tennessee', 'H', 'BCBS TN not paying — pull EOB; may need modifier/auth'],
  ['BCBS - OOS', 'H', 'OOS plan — confirm CPT coverage, check auth requirements'],
  ['American Specialty Health', 'H', 'ASH plan — verify CPT covered, check auth and modifier requirements'],
  ['STREAMLINE', 'H', "Workers' comp MCO — verify CPT coverage, check adjuster auth"],
  ['Care IQ', 'H', 'MCO managed program — confirm CPT covered under care plan'],
  ['Humana Gold Plus', 'M', 'MA plan — inconsistent adjudication, verify LCD alignment'],
  ['Blue Cross Medicare Advantage', 'M', 'MA plan — apply Medicare LCD logic, confirm credentialing'],
  ['TennCare', 'M', 'TennCare — verify benefit coverage for this CPT'],
  ['UnitedHealthcare', 'M', 'UHC — check contract coverage and auth requirements'],
  ['UMR', 'M', 'Self-funded — confirm coverage, contact plan administrator'],
  ['Aetna', 'M', 'Aetna — pull EOB, check coverage and auth requirements'],
  ['BARDAVON', 'M', "Workers' comp MCO — confirm CPT covered, check auth"],
  ['VHA', 'M', 'ChampVA — verify CPT covered, check VA auth'],
]

export function getPriority(payer: string): [Priority, string] {
  for (const [match, pri, action] of PAYER_PRIORITY_MAP) {
    if (payer.includes(match)) return [pri, action]
  }
  return ['L', 'Review EOB for denial reason; confirm benefit coverage']
}

export const fmt$ = (v: number) =>
  '$' + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const fmtK = (v: number) =>
  v >= 1_000_000 ? '$' + (v / 1_000_000).toFixed(1) + 'M'
  : v >= 1_000 ? '$' + (v / 1_000).toFixed(0) + 'K'
  : fmt$(v)

export const pct = (a: number, b: number) =>
  b ? (a / b * 100).toFixed(1) + '%' : '—'
