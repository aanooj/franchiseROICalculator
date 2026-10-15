import { fmt, fmtSigned, type Results } from '../lib/engine'

function Cell({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${className}`}>{value}</div>
    </div>
  )
}

export default function Dashboard({ r }: { r: Results }) {
  const positive = r.monthlyNet >= 0
  const netClass = positive ? 'text-emerald-600' : 'text-red-600'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-200 px-4 py-3 text-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
          Financial Performance Dashboard
        </h2>
        <p className="text-xs text-slate-400">Steady state at {Math.round(r.occupancyRate)}% of licensed capacity</p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 md:grid-cols-4 md:divide-x-0">
        <Cell label="Gross Monthly Revenue" value={fmt(r.grossMonthlyRevenue)} />
        <Cell label="Annualized Revenue" value={fmt(r.annualRevenue)} />
        <Cell label="Total Monthly Expenses" value={fmt(r.totalMonthlyExpenses)} />
        <Cell label="Annualized Expenses" value={fmt(r.annualExpenses)} />
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
        <div className="px-4 py-4 text-center">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Monthly Net Profit / Loss</div>
          <div className={`text-3xl font-extrabold tabular-nums ${netClass}`}>
            {fmtSigned(r.monthlyNet)} <span className="text-base font-semibold">/ mo</span>
          </div>
          {!positive && <div className="mt-1 text-xs font-semibold text-red-500">⚠ Operating at a loss</div>}
        </div>
        <div className="px-4 py-4 text-center">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Annual Net Profit / Loss</div>
          <div className={`text-3xl font-extrabold tabular-nums ${netClass}`}>
            {fmtSigned(r.annualNet)} <span className="text-base font-semibold">/ yr</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 md:grid-cols-4 md:divide-x-0">
        <Cell label="Net Profit Margin" value={`${r.netMargin.toFixed(1)}%`} className={netClass} />
        <Cell label="EBITDA Margin" value={`${r.ebitdaMargin.toFixed(1)}%`} />
        <Cell
          label="Est. Time to Break-Even"
          value={r.breakEvenMonth ? `${r.breakEvenMonth} mos` : '> horizon'}
        />
        <Cell
          label="Projected Payback Period"
          value={r.paybackMonths ? `${(r.paybackMonths / 12).toFixed(1)} yrs` : '> horizon'}
        />
      </div>

      <div className="px-4 py-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500">
          Capital Requirement Breakdown
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div className="flex justify-between"><span>Total Project Cost</span><b>{fmt(r.totalInvestment ?? 0)}</b></div>
          <div className="flex justify-between"><span>Bank Debt (CSBFP)</span><b>{fmt(r.bankDebt)}</b></div>
          <div className="flex justify-between"><span>Total Equity Required</span><b>{fmt(r.equityRequired)}</b></div>
          <div className="flex justify-between"><span>Monthly Debt Service</span><b>{fmt(r.debtService)}</b></div>
          <div className="flex justify-between"><span>Partner A Contribution</span><b>{fmt(r.partnerAEquity)}</b></div>
          <div className="flex justify-between"><span>Partner B Contribution</span><b>{fmt(r.partnerBEquity)}</b></div>
        </div>
      </div>

      {r.stressNotes.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          Stress test active: {r.stressNotes.join(' · ')}
        </div>
      )}
    </div>
  )
}
