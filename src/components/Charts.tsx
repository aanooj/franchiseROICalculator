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
  const data = r.projection.map((p) => ({
    month: p.month,
    net: Math.round(p.net),
    cumulative: Math.round(p.cumulative),
  }))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-600">
        Cash Flow Ramp-Up Curve
      </h3>
      <p className="mb-3 text-xs text-slate-400">
        Monthly net cash (build-out burn → positive ramp) and cumulative position
      </p>
      <ResponsiveContainer width="100%" height={300}>
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
      </ResponsiveContainer>
    </div>
  )
}
