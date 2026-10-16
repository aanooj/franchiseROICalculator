import Slider from './Slider'
import { calculate, fmt, FRANCHISE_PRESETS, scaleMixToCap, type FranchisePreset, type Inputs, type Results } from '../lib/engine'

const money = (v: number) => fmt(v)
const pct = (v: number) => `${v}%`

interface TabProps {
  inputs: Inputs
  set: <K extends keyof Inputs>(k: K, v: Inputs[K]) => void
  r: Results
}

export function FacilityTab({ inputs, set, r }: TabProps) {
  return (
    <div className="grid gap-y-2">
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Facility</h4>
        <Slider label="Total Facility Square Footage" value={inputs.squareFootage} min={3000} max={20000} step={250}
          onChange={(v) => set('squareFootage', v)} format={(v) => `${v.toLocaleString()} sq ft`}
          tip="Total indoor space of the centre. Monthly rent and utilities scale directly off this; larger spaces support more licensed rooms." />
        <Slider label="Base Rent + TMI (gross, per sq ft / yr)" value={inputs.grossRentPerSqFt} min={15} max={60} step={0.5}
          onChange={(v) => set('grossRentPerSqFt', v)} format={(v) => `$${v.toFixed(2)}`} hint="GTA childcare/industrial gross rent typically $28–$40"
          tip="Gross annual rent per square foot (base rent + TMI). Monthly rent = sq ft × this ÷ 12 — usually your single biggest fixed cost after payroll." />
        <Slider label="Utilities & Maintenance (per sq ft / yr)" value={inputs.utilitiesPerSqFt} min={1} max={6} step={0.25}
          onChange={(v) => set('utilitiesPerSqFt', v)} format={(v) => `$${v.toFixed(2)}`}
          tip="Annual utilities & maintenance cost per sq ft — hydro, gas, water, cleaning, repairs. Monthly = sq ft × this ÷ 12." />
        <Slider label="Target Maximum Capacity" value={inputs.targetMaxCapacity} min={60} max={158}
          onChange={(v) => set('targetMaxCapacity', v)} format={(v) => `${v} children`}
          hint="Spec range 120–143 depending on room layout — presets in Enrollment Mix scale to this cap"
          tip="The total number of children you plan to enroll at full capacity. Every mix preset and Randomize scales its room counts to stay within this cap." />
        <Slider label="Weekend / Summer Program Revenue" value={inputs.additionalProgramsRevenue} min={0} max={20000} step={500}
          onChange={(v) => set('additionalProgramsRevenue', v)} format={(v) => `${money(v)}/mo`}
          tip="Extra monthly revenue from programs outside core childcare — weekend camps, PA days, summer camps. Added on top of tuition income." />
      </div>
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          Capacity: {r.totalEnrolled} enrolled / {r.totalCapacity} licensed ({r.occupancyRate.toFixed(0)}%)
        </h4>
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          Monthly rent: <b>{money(r.rent)}</b> · Utilities: <b>{money(r.utilities)}</b>
          <br />
          Licensed capacity is the sum of room capacities below. The dashboard shows results at
          stabilized occupancy — adjust the ramp model under Scenarios.
        </div>
      </div>
    </div>
  )
}

const MIX_PRESETS: { name: string; note: string; enrolled: number[] }[] = [
  {
    name: 'Margin-optimized (older-heavy)',
    note: 'Maxes preschool/KG/school-age — high-ratio rooms need fewer staff per child',
    enrolled: [4, 8, 38, 49, 46],
  },
  {
    name: 'Balanced full-house',
    note: 'Spec default — every room near capacity',
    enrolled: [11, 14, 38, 45, 35],
  },
  {
    name: 'Lean older mix',
    note: 'Thin infant/toddler rooms, solid older groups — slow but survivable',
    enrolled: [4, 6, 30, 40, 30],
  },
  {
    name: 'Infant & toddler heavy',
    note: 'Worst case — low-ratio rooms burn payroll before tuition covers it',
    enrolled: [11, 14, 15, 15, 15],
  },
]

export function EnrollmentTab({ inputs, set, r }: TabProps) {
  // scale a preset's room counts so the total stays within targetMaxCapacity
  const scaledMix = (enrolled: number[]): number[] =>
    scaleMixToCap(enrolled, inputs.rooms, inputs.targetMaxCapacity)

  const applyMix = (enrolled: number[]) => {
    const scaled = scaledMix(enrolled)
    set('rooms', inputs.rooms.map((rm, i) => ({ ...rm, enrolled: scaled[i] })))
  }

  const randomize = () => {
    // random rooms, then rescale the whole mix to the target cap
    const raw = inputs.rooms.map((room) =>
      Math.floor(Math.random() * (room.capacity + 1)),
    )
    const scaled = scaledMix(raw)
    set('rooms', inputs.rooms.map((rm, i) => ({ ...rm, enrolled: scaled[i] })))
  }

  const isActive = (enrolled: number[]) => {
    const scaled = scaledMix(enrolled)
    return inputs.rooms.every((rm, i) => rm.enrolled === scaled[i])
  }

  const presetStats = (enrolled: number[]) => {
    const scaled = scaledMix(enrolled)
    return calculate({
      ...inputs,
      rooms: inputs.rooms.map((rm, i) => ({ ...rm, enrolled: scaled[i] })),
    })
  }

  return (
    <div>
      <div className="mb-2">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Mix Presets — best → worst
          </h4>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">
              Max children:{' '}
              <select
                className="rounded-md border border-slate-300 px-1.5 py-1 text-xs font-semibold text-indigo-700"
                value={inputs.targetMaxCapacity}
                onChange={(e) => set('targetMaxCapacity', Number(e.target.value))}
              >
                {[100, 110, 120, 130, 143, 158].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={randomize}
              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
            >
              🎲 Randomize mix
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {MIX_PRESETS.map((p) => {
            const res = presetStats(p.enrolled)
            const positive = res.monthlyNet >= 0
            return (
              <button
                key={p.name}
                onClick={() => applyMix(p.enrolled)}
                title={p.note}
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  isActive(p.enrolled)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                  <span
                    className={`whitespace-nowrap text-xs font-bold tabular-nums ${
                      positive ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {positive ? '+' : ''}
                    {fmt(res.monthlyNet)}/mo
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {p.note} · {res.totalEnrolled} kids ·{' '}
                  {res.breakEvenMonth ? `break-even mo ${res.breakEvenMonth}` : 'never profitable'}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        Room-by-Room Student Mix
      </h4>
      <div className="grid gap-y-2">
        {inputs.rooms.map((room, i) => {
          const st = r.staffing[i]
          return (
            <div key={room.id} className="rounded-lg border border-slate-100 p-2">
              <Slider
                label={`${room.label} — enrolled (cap ${room.capacity})`}
                value={room.enrolled}
                min={0}
                max={room.capacity}
                onChange={(v) => {
                  const rooms = inputs.rooms.map((rm, j) => (j === i ? { ...rm, enrolled: v } : rm))
                  set('rooms', rooms)
                }}
                format={(v) => `${v} / ${room.capacity}`}
                hint={`CCEYA ratio 1:${room.ratio} → ${st.requiredStaff} staff required at stabilized occupancy (${st.enrolled} kids)`}
                tip={`Ontario CCEYA ratio: 1 educator per ${room.ratio} children. Required staff = enrolled ÷ ${room.ratio}, rounded up — low-ratio rooms drive payroll hard.`}
              />
              <Slider
                label="Monthly tuition"
                value={room.tuition}
                min={800}
                max={2600}
                step={25}
                onChange={(v) => {
                  const rooms = inputs.rooms.map((rm, j) => (j === i ? { ...rm, tuition: v } : rm))
                  set('rooms', rooms)
                }}
                format={(v) => `${money(v)}/mo`}
                tip="Tuition charged per enrolled child in this room each month (parent fee after any CWELCC reduction)."
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StaffingTab({ inputs, set, r }: TabProps) {
  return (
    <div className="grid gap-y-2">
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Wages</h4>
        <Slider label="Base RECE Hourly Wage Floor" value={inputs.receHourlyWage} min={18} max={45} step={0.25}
          onChange={(v) => set('receHourlyWage', v)} format={(v) => `$${v.toFixed(2)}/hr`}
          tip="Hourly wage floor for Registered Early Childhood Educators — the bulk of your staff. GTA RECEs typically run $24–$30/hr." />
        <Slider label="Burdened Payroll Multiplier (CPP, EI, benefits)" value={inputs.burdenPercent} min={0} max={40} step={1}
          onChange={(v) => set('burdenPercent', v)} format={pct}
          hint={`Fully loaded RECE cost: $${(inputs.receHourlyWage * (1 + inputs.burdenPercent / 100)).toFixed(2)}/hr`}
          tip="Employer-side costs on top of wages: CPP, EI, WSIB and benefits — typically 18–25%. Fully loaded cost = wage × (1 + burden)." />
        <Slider label="Break-Relief / Floater Staff" value={inputs.floaterCount} min={0} max={8}
          onChange={(v) => set('floaterCount', v)} format={(v) => `${v} FTE`}
          tip="Extra educators covering staff breaks, lunches and absences — not counted toward any room's ratio requirement." />
        <Slider label="Centre Director (monthly salary)" value={inputs.directorMonthlySalary} min={0} max={10000} step={250}
          onChange={(v) => set('directorMonthlySalary', v)} format={(v) => `${money(v)}/mo`}
          tip="Monthly salary for the centre supervisor/director — a licensed supervisor is required per site." />
        <Slider label="Support Staff (kitchen / chef)" value={inputs.supportStaffCount} min={0} max={6}
          onChange={(v) => set('supportStaffCount', v)} format={(v) => `${v} FTE`}
          tip="Non-ratio staff like a cook/kitchen help or admin assistant, in full-time equivalents." />
        <Slider label="Support Staff Hourly Wage" value={inputs.supportHourlyWage} min={16} max={40} step={0.5}
          onChange={(v) => set('supportHourlyWage', v)} format={(v) => `$${v.toFixed(2)}/hr`}
          tip="Hourly wage for support staff — lower than RECE wage, but also gets the burden multiplier." />
      </div>
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          Staffing Compliance (CCEYA)
        </h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-400">
              <th className="py-1">Room</th>
              <th className="py-1 text-right">Kids</th>
              <th className="py-1 text-right">Ratio</th>
              <th className="py-1 text-right">Staff req.</th>
            </tr>
          </thead>
          <tbody>
            {r.staffing.map((s, i) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-1.5">{s.label}</td>
                <td className="py-1.5 text-right tabular-nums">{s.enrolled}/{s.capacity}</td>
                <td className="py-1.5 text-right">1:{inputs.rooms[i].ratio}</td>
                <td className="py-1.5 text-right font-semibold">{s.requiredStaff}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 font-semibold">
              <td className="py-1.5" colSpan={3}>
                Ratio staff {r.requiredRece} + floaters {inputs.floaterCount} + director 1 + support {inputs.supportStaffCount}
              </td>
              <td className="py-1.5 text-right">{r.totalFte} FTE</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          Monthly burdened payroll: <b>{money(r.monthlyPayroll)}</b>
          <br />
          Labour cost: <b>{r.laborPercent.toFixed(1)}%</b> of gross revenue
        </div>
      </div>
    </div>
  )
}

export function CapitalTab({ inputs, set, r }: TabProps) {
  return (
    <div className="grid gap-y-2">
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Financing</h4>
        <Slider label="Total Initial Investment / Build-out" value={inputs.totalInvestment} min={400000} max={5000000} step={50000}
          onChange={(v) => {
            set('totalInvestment', v)
            if (inputs.franchisePreset !== 'custom') set('franchisePreset', 'custom')
          }} format={money}
          hint="CEFA ~$1.9–3.9M · Maple Bear $0.85–2.5M (call: $1.5M typical)"
          tip="Everything it takes to open: build-out/renovations, franchise fee, furniture & equipment, licensing and working-capital cushion." />
        <Slider label="Debt Share (CSBFP / bank)" value={inputs.debtPercent} min={0} max={90} step={5}
          onChange={(v) => set('debtPercent', v)} format={pct}
          hint={`Debt ${money(r.bankDebt)} · Equity ${money(r.equityRequired)}`}
          tip="Share of the investment financed by a CSBFP/bank loan; the rest comes out of partner equity. More debt = higher monthly debt service but less cash in." />
        <Slider label="Interest Rate (annual)" value={inputs.interestRate} min={0} max={15} step={0.25}
          onChange={(v) => set('interestRate', v)} format={(v) => `${v.toFixed(2)}%`}
          tip="Annual interest rate on the loan. CSBFP loans typically price around prime + 3%." />
        <Slider label="Amortization" value={inputs.amortizationYears} min={3} max={25}
          onChange={(v) => set('amortizationYears', v)} format={(v) => `${v} yrs`}
          tip="Loan repayment schedule length. Longer amortization = smaller monthly payment, more total interest." />
      </div>
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Partners</h4>
        <Slider label="Partner A Equity Share" value={inputs.partnerAShare} min={0} max={100} step={5}
          onChange={(v) => set('partnerAShare', v)} format={pct}
          hint={`A: ${money(r.partnerAEquity)} · B: ${money(r.partnerBEquity)}`}
          tip="Partner A's percentage of the equity — sets both partners' capital contributions and how remaining profit splits." />
        <Slider label="Partner A Mgmt Salary (active operator)" value={inputs.partnerASalary} min={0} max={15000} step={250}
          onChange={(v) => set('partnerASalary', v)} format={(v) => `${money(v)}/mo`}
          tip="Monthly management salary for Partner A as the active operator. Paid as an expense before net profit is split." />
        <Slider label="Partner B Mgmt Salary" value={inputs.partnerBSalary} min={0} max={15000} step={250}
          onChange={(v) => set('partnerBSalary', v)} format={(v) => `${money(v)}/mo`}
          hint="Salaries are expensed before net profit; remaining profit splits by equity share"
          tip="Monthly management salary for Partner B. A silent/passive partner would typically take $0." />
        <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
          Steady-state monthly distributions after all expenses:
          <br />
          Partner A: <b>{money(Math.max(r.monthlyNet, 0) * inputs.partnerAShare / 100)}</b> ·
          Partner B: <b>{money(Math.max(r.monthlyNet, 0) * (100 - inputs.partnerAShare) / 100)}</b>
        </div>
      </div>
    </div>
  )
}

export function CostsTab({ inputs, set, r }: TabProps) {
  const feeTotal = inputs.royaltyPercent + inputs.brandFundPercent + inputs.localMarketingPercent

  const applyFranchise = (preset: FranchisePreset) => {
    if (preset === 'custom') {
      set('franchisePreset', 'custom')
      return
    }
    const p = FRANCHISE_PRESETS[preset]
    set('royaltyPercent', p.royaltyPercent)
    set('brandFundPercent', p.brandFundPercent)
    set('localMarketingPercent', p.localMarketingPercent)
    set('totalInvestment', p.totalInvestment)
    // brand's site profile, where published/quoted
    const cap = p.targetMaxCapacity ?? inputs.targetMaxCapacity
    if (p.squareFootage !== undefined) set('squareFootage', p.squareFootage)
    if (p.targetMaxCapacity !== undefined) set('targetMaxCapacity', p.targetMaxCapacity)
    if (p.debtPercent !== undefined) set('debtPercent', p.debtPercent)
    if (p.preOpeningBurn !== undefined) set('preOpeningBurn', p.preOpeningBurn)
    if (p.mix !== undefined || p.tuition !== undefined) {
      const scaled = p.mix
        ? scaleMixToCap(p.mix, inputs.rooms, cap)
        : inputs.rooms.map((rm) => rm.enrolled)
      set(
        'rooms',
        inputs.rooms.map((rm, i) => ({
          ...rm,
          enrolled: scaled[i],
          tuition: p.tuition !== undefined ? p.tuition : rm.tuition,
        })),
      )
    }
    set('franchisePreset', preset)
  }

  const editingFee = <K extends keyof Inputs>(k: K, v: Inputs[K]) => {
    set(k, v)
    if (inputs.franchisePreset !== 'custom') set('franchisePreset', 'custom')
  }

  const presetInfo =
    inputs.franchisePreset !== 'custom' ? FRANCHISE_PRESETS[inputs.franchisePreset] : null

  return (
    <div className="grid gap-y-2">
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Franchise Fees</h4>
        <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
          Franchise:
          <select
            className="rounded-md border border-slate-300 px-2 py-1 text-sm font-semibold text-indigo-700"
            value={inputs.franchisePreset}
            onChange={(e) => applyFranchise(e.target.value as FranchisePreset)}
          >
            <option value="cefa">CEFA Early Learning</option>
            <option value="maplebear">Maple Bear</option>
            <option value="custom">Custom (manual)</option>
          </select>
        </label>
        {presetInfo && (
          <div className="mb-2 rounded-lg bg-indigo-50 p-2.5 text-xs text-indigo-900">
            <b>{presetInfo.name}</b> — fee {money(presetInfo.franchiseFee)} (inside investment),
            royalty {presetInfo.royaltyPercent}% + brand fund {presetInfo.brandFundPercent}% +
            local mktg {presetInfo.localMarketingPercent}%, typical build{' '}
            {presetInfo.investmentRange}.<br />
            {presetInfo.note}
          </div>
        )}
        <Slider label="Royalty" value={inputs.royaltyPercent} min={0} max={15} step={0.5}
          onChange={(v) => editingFee('royaltyPercent', v)} format={pct}
          tip="Franchise royalty paid to the franchisor as a % of gross revenue — childcare franchises typically run 5–8%." />
        <Slider label="Brand Fund" value={inputs.brandFundPercent} min={0} max={8} step={0.5}
          onChange={(v) => editingFee('brandFundPercent', v)} format={pct}
          tip="Contribution to the franchisor's national brand/marketing fund, as a % of gross revenue." />
        <Slider label="Local Marketing" value={inputs.localMarketingPercent} min={0} max={8} step={0.5}
          onChange={(v) => editingFee('localMarketingPercent', v)} format={pct}
          hint={`Total fee load ${feeTotal}% of gross → ${money(r.franchiseFees)}/mo`}
          tip="Required local advertising spend you control, as a % of gross revenue." />
      </div>
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Operating Costs</h4>
        <Slider label="Food & Catering (per child / mo)" value={inputs.foodCostPerChild} min={0} max={300} step={10}
          onChange={(v) => set('foodCostPerChild', v)} format={money}
          tip="Monthly food & catering cost per enrolled child — meals, snacks and milk service." />
        <Slider label="Educational Materials (per child / mo)" value={inputs.materialsCostPerChild} min={0} max={150} step={5}
          onChange={(v) => set('materialsCostPerChild', v)} format={money}
          tip="Monthly cost per child for curriculum materials, art supplies, toys and activities." />
        <Slider label="Commercial Insurance" value={inputs.insuranceMonthly} min={0} max={6000} step={100}
          onChange={(v) => set('insuranceMonthly', v)} format={(v) => `${money(v)}/mo`}
          tip="Monthly commercial insurance premium — liability, property, abuse/blanket coverage required to operate." />
        <Slider label="Admin & Software" value={inputs.adminMonthly} min={0} max={8000} step={100}
          onChange={(v) => set('adminMonthly', v)} format={(v) => `${money(v)}/mo`}
          tip="Monthly back-office costs — childcare management software, bookkeeping, phone/internet, office supplies." />
      </div>
    </div>
  )
}

export function ScenariosTab({ inputs, set, r }: TabProps) {
  return (
    <div className="grid gap-y-2">
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Stress Tests</h4>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
          <input type="checkbox" className="h-5 w-5 accent-red-600" checked={inputs.wageInflationOn}
            onChange={(e) => set('wageInflationOn', e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">ECE Wage Inflation +15%</div>
            <div className="text-xs text-slate-500">Recalculates payroll and margin impact instantly</div>
          </div>
        </label>
        <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
          <input type="checkbox" className="h-5 w-5 accent-red-600" checked={inputs.occupancyDipOn}
            onChange={(e) => set('occupancyDipOn', e.target.checked)} />
          <div>
            <div className="text-sm font-semibold">Occupancy Dip −10%</div>
            <div className="text-xs text-slate-500">Simulates slower GTA market adoption; stresses cash runway and break-even</div>
          </div>
        </label>
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          Break-even: <b>{r.breakEvenMonth ? `month ${r.breakEvenMonth}` : 'beyond horizon'}</b> ·
          Payback: <b>{r.paybackMonths ? `${(r.paybackMonths / 12).toFixed(1)} yrs` : 'beyond horizon'}</b>
        </div>
      </div>
      <div>
        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Ramp-Up Model</h4>
        <Slider label="Build-out Phase" value={inputs.buildOutMonths} min={0} max={18}
          onChange={(v) => set('buildOutMonths', v)} format={(v) => `${v} mos`}
          tip="Months of construction/renovation before opening. No tuition revenue — but rent, interest and pre-opening burn still accrue." />
        <Slider label="Ramp Period (open → stabilized)" value={inputs.rampMonths} min={3} max={36}
          onChange={(v) => set('rampMonths', v)} format={(v) => `${v} mos`}
          tip="Months from opening day until enrollment reaches stabilized occupancy. Revenue climbs up this ramp." />
        <Slider label="Opening Occupancy" value={Math.round(inputs.openingOccupancy * 100)} min={10} max={100} step={5}
          onChange={(v) => set('openingOccupancy', v / 100)} format={pct}
          tip="Percent of target enrollment signed up on day one — pre-registration and waitlist fill this." />
        <Slider label="Stabilized Occupancy" value={Math.round(inputs.stabilizedOccupancy * 100)} min={50} max={100} step={5}
          onChange={(v) => set('stabilizedOccupancy', v / 100)} format={pct}
          tip="Percent of target enrollment once the centre matures. The dashboard's monthly profit figures are at this steady state." />
        <Slider label="Pre-Opening Monthly Burn" value={inputs.preOpeningBurn} min={0} max={60000} step={1000}
          onChange={(v) => set('preOpeningBurn', v)} format={(v) => `${money(v)}/mo`}
          hint="Marketing, training, licensing during build-out (rent + interest added automatically)"
          tip="Monthly spend during the build-out phase — marketing, staff training, licensing — stacked on top of rent and loan interest." />
      </div>
    </div>
  )
}
