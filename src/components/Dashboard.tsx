import { fmt, fmtSigned, type Results } from '../lib/engine'

function Cell({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${className}`}>{value}</div>
    </div>
  )
}

function FlowRow({
  label,
  amount,
  pctOfRev,
  barClass,
  amountClass = 'font-medium text-slate-800',
}: {
  label: string
  amount: number
  pctOfRev: number // share of gross monthly revenue, %
  barClass: string
  amountClass?: string
}) {
  return (
    <div className="flex items-center gap-3 py-[3px] text-sm">
      <span className="w-36 shrink-0 truncate text-slate-600 sm:w-48">{label}</span>
      <span className="relative h-3.5 min-w-8 flex-1 overflow-hidden rounded-sm bg-slate-100">
        <span
          className={`absolute inset-y-0 left-0 ${barClass}`}
          style={{ width: `${Math.min(Math.max(pctOfRev, 0), 100)}%` }}
        />
      </span>
      <span className={`w-20 shrink-0 text-right tabular-nums ${amountClass}`}>{fmt(amount)}</span>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-400">
        {pctOfRev.toFixed(0)}%
      </span>
    </div>
  )
}

export default function Dashboard({ r }: { r: Results }) {
  const positive = r.monthlyNet >= 0
  const netClass = positive ? 'text-emerald-600' : 'text-red-600'
  const rev = Math.max(r.grossMonthlyRevenue, 1)
  const pct = (n: number) => (n / rev) * 100

  const expenseLines = [
    { label: `Payroll & wages (${r.totalFte} FTE)`, amount: r.payroll },
    { label: 'Rent + TMI', amount: r.rent },
    { label: 'Debt service (CSBFP)', amount: r.debtService },
    { label: 'Franchise fees', amount: r.franchiseFees },
    { label: 'Food & catering', amount: r.food },
    { label: 'Materials & supplies', amount: r.materials },
    { label: 'Utilities & maintenance', amount: r.utilities },
    { label: 'Admin & software', amount: r.admin },
    { label: 'Insurance', amount: r.insurance },
    { label: 'Partner salaries', amount: r.partnerSalaries },
  ]
    .filter((e) => e.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-200 px-4 py-3 text-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
          Financial Performance Dashboard
        </h2>
        <p className="text-xs text-slate-400">Steady state at {Math.round(r.occupancyRate)}% of licensed capacity</p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
        <Cell label="Gross Monthly Revenue" value={fmt(r.grossMonthlyRevenue)} />
        <Cell label="Total Monthly Expenses" value={fmt(r.totalMonthlyExpenses)} />
        <Cell label="Monthly Net" value={fmtSigned(r.monthlyNet)} className={netClass} />
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Monthly P&amp;L — where each dollar goes
          </div>
          <div className="text-[11px] text-slate-400">% of revenue</div>
        </div>

        <FlowRow
          label="Revenue (tuition + programs)"
          amount={r.grossMonthlyRevenue}
          pctOfRev={100}
          barClass="bg-emerald-400/70"
          amountClass="font-bold text-emerald-700"
        />
        <div className="my-1.5 border-t border-dashed border-slate-200" />
        {expenseLines.map((e) => (
          <FlowRow
            key={e.label}
            label={e.label}
            amount={e.amount}
            pctOfRev={pct(e.amount)}
            barClass="bg-rose-300/80"
          />
        ))}
        <div className="my-1.5 border-t border-dashed border-slate-200" />
        <FlowRow
          label="Total expenses"
          amount={r.totalMonthlyExpenses}
          pctOfRev={pct(r.totalMonthlyExpenses)}
          barClass="bg-slate-400/70"
          amountClass="font-semibold text-slate-900"
        />
        <div className={`mt-2 flex items-center justify-between rounded-lg px-3 py-2 ${
          positive ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          <span className="text-sm font-bold text-slate-800">Net Profit / Loss</span>
          <span className={`text-xl font-extrabold tabular-nums ${netClass}`}>
            {fmtSigned(r.monthlyNet)} <span className="text-sm font-semibold">/ mo</span>
          </span>
        </div>
        {!positive && (
          <div className="mt-1 text-center text-xs font-semibold text-red-500">
            ⚠ Operating at a loss
          </div>
        )}
        <div className="mt-2 text-center text-xs tabular-nums text-slate-500">
          Annualized — revenue {fmt(r.annualRevenue)} · expenses {fmt(r.annualExpenses)} · net{' '}
          <b className={netClass}>{fmtSigned(r.annualNet)}</b>
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
