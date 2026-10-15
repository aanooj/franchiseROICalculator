import { useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Results } from '../lib/engine'

const fmtK = (n: number) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toFixed(0)}`)

export function EnrollmentStaffingChart({ r }: { r: Results }) {
  // Stacked enrollment by room + total staff headcount (dual axis) over the ramp
  const data = r.projection
    .filter((p) => p.phase !== 'build-out')
    .map((p) => {
      const row: Record<string, number> = { month: p.month, staff: p.staff }
      return row
    })

  // Re-derive per-room enrollment per month from the projection isn't stored;
  // approximate per-room mix by scaling steady-state mix by occupancy.
  const steadyTotal = Math.max(r.totalEnrolled, 1)
  const rows = data.map((d) => {
    const p = r.projection.find((x) => x.month === d.month)!
    const row: Record<string, number> = { month: p.month, staff: p.staff }
    for (const s of r.staffing) {
      row[s.label] = Math.round((s.enrolled / steadyTotal) * p.enrollment)
    }
    return row
  })

  const colors = ['#6366f1', '#22d3ee', '#34d399', '#fbbf24', '#f472b6']

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-600">
        Staffing &amp; Enrollment Ramp
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        Students by age group (bars) vs. total staff headcount (line)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis yAxisId="kids" tick={{ fontSize: 11 }} label={{ value: 'Students', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <YAxis yAxisId="staff" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'Staff', angle: 90, position: 'insideRight', fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {r.staffing.map((s, i) => (
            <Bar key={s.id} yAxisId="kids" dataKey={s.label} stackId="enroll" fill={colors[i % colors.length]} />
          ))}
          <Line yAxisId="staff" type="monotone" dataKey="staff" name="Total staff" stroke="#dc2626" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CashFlowChart({ r }: { r: Results }) {
  const [view, setView] = useState<'continuous' | 'yearly'>('continuous')

  const data = r.projection.map((p) => ({
    month: p.month,
    net: Math.round(p.net),
    cumulative: Math.round(p.cumulative),
  }))

  // bucket the projection into 12-month years: annual net + year-end position
  const years: { year: number; net: number; cumulative: number }[] = []
  for (let y = 0; y * 12 < data.length; y++) {
    const slice = data.slice(y * 12, (y + 1) * 12)
    years.push({
      year: y + 1,
      net: slice.reduce((s, d) => s + d.net, 0),
      cumulative: slice[slice.length - 1].cumulative,
    })
  }

  const viewBtn = (v: 'continuous' | 'yearly', label: string) => (
    <button
      onClick={() => setView(v)}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
        view === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          Cash Flow Ramp-Up Curve
        </h3>
        <div className="flex gap-1">
          {viewBtn('continuous', 'Continuous')}
          {viewBtn('yearly', 'Year over year')}
        </div>
      </div>
      <p className="mb-3 text-xs text-slate-400">
        {view === 'continuous'
          ? 'Monthly net cash (build-out burn → positive ramp) and cumulative position'
          : 'Annual net cash per year (bars) and cash position at each year-end (line)'}
      </p>
      <ResponsiveContainer width="100%" height={300}>
        {view === 'continuous' ? (
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmtK(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Area type="monotone" dataKey="net" name="Monthly net" fill="#6366f133" stroke="#6366f1" strokeWidth={2} />
            <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#059669" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        ) : (
          <ComposedChart data={years} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v) => `Yr ${v}`} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmtK(Number(v))} labelFormatter={(v) => `Year ${v}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#94a3b8" />
            <Bar dataKey="net" name="Annual net" fill="#6366f1" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
