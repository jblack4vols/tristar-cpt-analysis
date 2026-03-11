# Tristar PT — CPT Analytics

Revenue analytics dashboard for Tristar Physical Therapy. Analyzes CPT billing data to identify zero-pay claims, denial patterns, and provider/payer performance.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + TypeScript
- **Tailwind CSS** for styling
- **Supabase** (PostgreSQL) for data storage
- **xlsx** for Excel file parsing

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with the required database schema and RPC functions

### Setup

```bash
# Install dependencies
npm install

# Copy environment config and fill in your Supabase credentials
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Features

- **Data Import** — Upload Prompt EMR CPT Revenue Reports (.xlsx)
- **Executive Summary** — CPT code analysis with drill-down to individual claims
- **Payer Analysis** — Insurance company performance with priority-based flagging
- **Provider Summary** — Therapist performance metrics
- **Zero-Pay Worklist** — Priority-filtered claims at risk
- **Strapping Codes** — Focused 29xxx code analysis (active BCBS audit tracking)
- **Raw Claims** — Complete dataset with filters and search
- **Dark/Light Theme** — Persistent toggle

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run unit tests
npm run test:watch # Run tests in watch mode
```

## Project Structure

```
app/
  api/
    upload/     POST — Excel import, data parsing, batch insert
    datasets/   GET, DELETE — Dataset management
    claims/     GET — Claims filtering & pagination
    summary/    GET — Summary via Supabase RPC functions
  page.tsx      Main dashboard with tab navigation
components/
  TopBar.tsx        Header with dataset selector, theme toggle
  ExecTab.tsx       Executive summary with CPT drill-down
  DrillPanel.tsx    Reusable claim drill-down panel
  PayerTab.tsx      Payer analysis with priority badges
  ProviderTab.tsx   Therapist/provider performance
  WorklistTab.tsx   Zero-pay claims worklist
  StrapTab.tsx      Strapping codes (29xxx) analysis
  RawClaimsTab.tsx  Complete claims table
  Table.tsx         Reusable table components & sorting
  Pagination.tsx    Shared pagination component
  ImportModal.tsx   File upload modal
  ErrorBoundary.tsx React error boundary
  ConfirmDialog.tsx Confirmation dialog for destructive actions
lib/
  supabase.ts    Supabase client + TypeScript interfaces
  constants.ts   CPT descriptions, payer priorities, formatters
  parsing.ts     Date/number parsing utilities
  theme.tsx      Dark/light mode provider
```

## Database Requirements

The app requires three Supabase RPC functions:
- `cpt_summary(p_dataset_id)` — CPT code aggregation
- `payer_summary(p_dataset_id)` — Payer aggregation
- `provider_summary(p_dataset_id)` — Provider aggregation

And two tables:
- `datasets` — id, label, period_start, period_end, row_count, is_active, created_at
- `claims` — id, dataset_id, patient, dos, claim_number, payer, therapist, facility, cpt, billed, allowed, paid
