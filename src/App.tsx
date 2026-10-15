import { useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import { CashFlowChart, EnrollmentStaffingChart } from './components/Charts'
import { CapitalTab, CostsTab, EnrollmentTab, FacilityTab, ScenariosTab, StaffingTab } from './components/InputTabs'
import { calculate, DEFAULT_INPUTS, type Inputs } from './lib/engine'

const TABS = [
  { id: 'facility', label: 'Facility & Capacity', C: FacilityTab },
  { id: 'enrollment', label: 'Enrollment Mix', C: EnrollmentTab },
  { id: 'staffing', label: 'Staffing & Wages', C: StaffingTab },
  { id: 'costs', label: 'Costs & Fees', C: CostsTab },
  { id: 'capital', label: 'Capital & Partners', C: CapitalTab },
  { id: 'scenarios', label: 'Scenarios', C: ScenariosTab },
] as const

export default function App() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)
  const [tab, setTab] = useState<string>('facility')
  const results = useMemo(() => calculate(inputs), [inputs])

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [k]: v }))

  const Active = TABS.find((t) => t.id === tab)!.C

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-slate-800">
          GTA Childcare Franchise ROI &amp; Operational Calculator
        </h1>
        <p className="text-sm text-slate-500">
          CCEYA-compliant staffing, financing, and ramp-up model — every slider updates the model instantly.
        </p>
      </header>

      <Dashboard r={results} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <EnrollmentStaffingChart r={results} />
        <CashFlowChart r={results} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setInputs(DEFAULT_INPUTS)}
            className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-100"
          >
            Reset defaults
          </button>
        </div>
        <div className="p-4">
          <Active inputs={inputs} set={set} r={results} />
        </div>
      </div>

      <footer className="mt-6 text-center text-xs text-slate-400">
        Ratios per Ontario Child Care and Early Years Act (infant 1:3, toddler 1:5, preschool 1:8,
        kindergarten 1:13, school-age 1:15). Figures are estimates for planning only.
      </footer>
    </div>
  )
}
