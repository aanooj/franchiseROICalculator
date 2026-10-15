# GTA Childcare Franchise ROI & Operational Calculator

Interactive financial model for a licensed childcare franchise in the Greater Toronto Area.
Every slider updates the model instantly — staffing compliance, payroll, franchise fees,
debt service, partner equity splits, ramp-up cash flow, and stress tests.

## Stack

Vite + React 19 + TypeScript + Tailwind CSS 4 + Recharts. No backend — all calculations
run client-side in `src/lib/engine.ts`.

## Features

- **Financial Performance Dashboard** — gross/annualized revenue & expenses, monthly &
  annual net profit (green/red conditional), net & EBITDA margins, break-even month,
  payback period, and capital requirement breakdown.
- **Dynamic Staffing Engine** — Ontario CCEYA ratios (infant 1:3, toddler 1:5,
  preschool 1:8, kindergarten 1:13, school-age 1:15) computed per room in real time,
  plus floaters, centre director, and support staff at a burdened payroll multiplier.
- **Input tabs** — Facility & Capacity, Enrollment Mix (per-room sliders + tuition),
  Staffing & Wages, Costs & Fees, Capital & Partners, Scenarios.
- **Charts** — dual-axis enrollment/staffing ramp and a cash-flow ramp-up curve
  (build-out burn → stabilized).
- **Stress tests** — ECE wage inflation +15% and occupancy dip −10% toggles.
- **Partner module** — debt/equity split (e.g. CSBFP financing), partner equity
  contributions, and management salaries.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```

Deploys as a static site (e.g. Vercel — framework preset: Vite, no env vars needed).

> Figures are planning estimates only, not financial advice.
