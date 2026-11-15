# PaycheckBeam

Paycheck calculator for all 50 US states + Washington, DC, with verified 2026 federal and state tax rates. Enter your pay, pick your state, and see your take-home pay per paycheck and per year — federal withholding (IRS Pub 15-T), Social Security, Medicare, and state income tax.

Live: https://paycheckbeam.com

## Stack

Next.js 16 + React 19 + TypeScript + Tailwind v4, App Router, plain SSG. No database — all tax data is static and compiled in at build time.

## What's inside

- `app/page.tsx` — homepage with the embedded calculator, 2026 federal brackets, 51-state directory, FAQ
- `app/[stateSlug]/page.tsx` — one page per state (`/texas-paycheck-calculator/` etc.), all statically generated
- `components/PaycheckCalculator.tsx` — the calculator UI (salary/hourly, pay frequency, filing status, 401(k) + health-insurance inputs)
- `lib/paycheckCalc.ts` — the engine (IRS Pub 15-T percentage method, FICA)
- `lib/stateTaxData.ts` — all 51 jurisdictions: brackets, rates, standard deductions, credits

## Data (2026)

- Federal: IRS Pub 15-T / Rev. Proc. 2025-32. Standard deduction single $16,100 / MFJ $32,200 / HoH $24,150.
- FICA: Social Security 6.2% up to wage base $184,500 (SSA-confirmed); Medicare 1.45% + 0.9% additional over $200k.
- State brackets: Tax Foundation 2026 tables, cross-checked; Georgia 4.99% per HB 463 (May 2026). CA brackets are 2025 widths (2026 FTB adjustment unpublished at compile time) — labelled on the page. Local city/county taxes are not modelled.
- Full source table: `~/workspace/paycheckbeam-research/tax-tables-2026.json` (not in this repo).

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm run start   # production
```

## Deploy

Vercel, from this repo. No environment variables needed.
