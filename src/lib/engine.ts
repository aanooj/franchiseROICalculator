// GTA Childcare Franchise ROI & Operational Calculator — calculation engine.
// All dollar values are CAD. Ratios follow the Ontario CCEYA.

export interface RoomInput {
  id: string
  label: string
  capacity: number
  enrolled: number
  tuition: number // $/child/month
  ratio: number // 1 staff per `ratio` children
}

export interface Inputs {
  // Facility & capacity
  squareFootage: number
  grossRentPerSqFt: number // $/sq ft/year, rent + TMI
  utilitiesPerSqFt: number // $/sq ft/year
  targetMaxCapacity: number // target maximum children (120–143 per layout)
  rooms: RoomInput[]
  additionalProgramsRevenue: number // weekend/summer programs, $/month

  // Staffing & wages
  receHourlyWage: number // base RECE wage floor
  burdenPercent: number // CPP/EI/benefits load on top of base wage
  floaterCount: number // break-relief floaters
  directorMonthlySalary: number
  supportStaffCount: number // kitchen/chef etc.
  supportHourlyWage: number

  // Overhead
  foodCostPerChild: number // $/child/month
  materialsCostPerChild: number // $/child/month
  insuranceMonthly: number
  adminMonthly: number // software, phone, misc admin
  royaltyPercent: number // of gross revenue
  brandFundPercent: number
  localMarketingPercent: number

  // Capital & partners
  totalInvestment: number
  debtPercent: number // % of totalInvestment financed (e.g. CSBFP)
  interestRate: number // annual %
  amortizationYears: number
  partnerAShare: number // % of equity held by partner A
  partnerASalary: number // monthly mgmt salary (active operator)
  partnerBSalary: number

  // Ramp-up model
  buildOutMonths: number
  rampMonths: number
  openingOccupancy: number // fraction of enrolled at open
  stabilizedOccupancy: number // fraction of enrolled at end of ramp
  preOpeningBurn: number // extra monthly burn during build-out

  // Stress tests
  wageInflationOn: boolean
  occupancyDipOn: boolean
}

export const ROOM_PRESETS: Omit<RoomInput, 'enrolled' | 'tuition'>[] = [
  { id: 'infant', label: 'Infant Room', capacity: 11, ratio: 3 },
  { id: 'toddler', label: 'Toddler Room', capacity: 14, ratio: 5 },
  { id: 'preschool', label: 'Preschool Rooms (1 & 2)', capacity: 38, ratio: 8 },
  { id: 'kindergarten', label: 'Kindergarten Rooms (1 & 2)', capacity: 49, ratio: 13 },
  { id: 'schoolage', label: 'School Age Rooms (Jr & Sr)', capacity: 46, ratio: 15 },
]

export const DEFAULT_INPUTS: Inputs = {
  squareFootage: 10000,
  grossRentPerSqFt: 34,
  utilitiesPerSqFt: 3,
  targetMaxCapacity: 120,
  rooms: [
    { ...ROOM_PRESETS[0], enrolled: 11, tuition: 1800 },
    { ...ROOM_PRESETS[1], enrolled: 14, tuition: 1800 },
    { ...ROOM_PRESETS[2], enrolled: 38, tuition: 1800 },
    { ...ROOM_PRESETS[3], enrolled: 45, tuition: 1800 },
    { ...ROOM_PRESETS[4], enrolled: 35, tuition: 1800 },
  ],
  additionalProgramsRevenue: 4000,

  receHourlyWage: 25.86,
  burdenPercent: 20,
  floaterCount: 2,
  directorMonthlySalary: 5500,
  supportStaffCount: 1,
  supportHourlyWage: 22,

  foodCostPerChild: 120,
  materialsCostPerChild: 30,
  insuranceMonthly: 1500,
  adminMonthly: 2000,
  royaltyPercent: 7,
  brandFundPercent: 2.5,
  localMarketingPercent: 1,

  totalInvestment: 2500000,
  debtPercent: 70,
  interestRate: 7,
  amortizationYears: 10,
  partnerAShare: 50,
  partnerASalary: 6000,
  partnerBSalary: 0,

  buildOutMonths: 6,
  rampMonths: 18,
  openingOccupancy: 0.5,
  stabilizedOccupancy: 0.95,
  preOpeningBurn: 15000,

  wageInflationOn: false,
  occupancyDipOn: false,
}

export const HOURS_PER_MONTH = (40 * 52) / 12 // 173.33

export interface RoomStaffing {
  id: string
  label: string
  enrolled: number
  capacity: number
  requiredStaff: number
}

export interface MonthlyProjection {
  month: number
  phase: 'build-out' | 'ramp' | 'stabilized'
  occupancy: number
  enrollment: number
  staff: number
  revenue: number
  expenses: number
  net: number
  cumulative: number
}

export interface Results {
  // enrollment & staffing
  totalEnrolled: number
  totalCapacity: number
  occupancyRate: number
  staffing: RoomStaffing[]
  requiredRece: number
  totalFte: number // RECEs + floaters + director + support
  monthlyPayroll: number
  laborPercent: number // of gross revenue

  // revenue
  grossMonthlyRevenue: number
  annualRevenue: number

  // expenses
  payroll: number
  rent: number
  utilities: number
  food: number
  materials: number
  insurance: number
  admin: number
  franchiseFees: number
  partnerSalaries: number
  debtService: number
  totalMonthlyExpenses: number
  annualExpenses: number

  // profit
  monthlyNet: number
  annualNet: number
  netMargin: number // %
  ebitda: number // monthly net + interest portion of debt service
  ebitdaMargin: number

  // capital
  totalInvestment: number
  bankDebt: number
  equityRequired: number
  partnerAEquity: number
  partnerBEquity: number

  // projections
  breakEvenMonth: number | null // first month with net >= 0
  paybackMonths: number | null // cumulative net >= equity
  projection: MonthlyProjection[]

  // flags
  stressNotes: string[]
}

function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0) return 0
  const r = annualRatePct / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

function staffingFor(
  rooms: RoomInput[],
  occupancy: number,
  dip: boolean,
): { staffing: RoomStaffing[]; requiredRece: number; enrolled: number } {
  const dipFactor = dip ? 0.9 : 1
  const staffing = rooms.map((room) => {
    const enrolled = Math.min(room.capacity, Math.round(room.enrolled * occupancy * dipFactor))
    return {
      id: room.id,
      label: room.label,
      enrolled,
      capacity: room.capacity,
      requiredStaff: enrolled === 0 ? 0 : Math.ceil(enrolled / room.ratio),
    }
  })
  return {
    staffing,
    requiredRece: staffing.reduce((s, r) => s + r.requiredStaff, 0),
    enrolled: staffing.reduce((s, r) => s + r.enrolled, 0),
  }
}

export function calculate(raw: Inputs): Results {
  const inputs: Inputs = {
    ...raw,
    receHourlyWage: raw.receHourlyWage * (raw.wageInflationOn ? 1.15 : 1),
    supportHourlyWage: raw.supportHourlyWage * (raw.wageInflationOn ? 1.15 : 1),
    directorMonthlySalary: raw.directorMonthlySalary * (raw.wageInflationOn ? 1.15 : 1),
  }

  const stressNotes: string[] = []
  if (raw.wageInflationOn) stressNotes.push('ECE wage inflation +15% applied')
  if (raw.occupancyDipOn) stressNotes.push('Occupancy dip -10% enrollment applied')

  const burdenedRece = inputs.receHourlyWage * (1 + inputs.burdenPercent / 100)
  const burdenedSupport = inputs.supportHourlyWage * (1 + inputs.burdenPercent / 100)

  // --- steady state (occupancy = stabilizedOccupancy on enrolled sliders) ---
  const steady = staffingFor(inputs.rooms, inputs.stabilizedOccupancy, inputs.occupancyDipOn)

  const totalCapacity = inputs.rooms.reduce((s, r) => s + r.capacity, 0)
  const tuitionRevenue = inputs.rooms.reduce((sum, room, i) => {
    const enrolled = steady.staffing[i].enrolled
    return sum + enrolled * room.tuition
  }, 0)
  const grossMonthlyRevenue = tuitionRevenue + inputs.additionalProgramsRevenue
  const annualRevenue = grossMonthlyRevenue * 12

  const payroll =
    (steady.requiredRece + inputs.floaterCount) * burdenedRece * HOURS_PER_MONTH +
    inputs.directorMonthlySalary +
    inputs.supportStaffCount * burdenedSupport * HOURS_PER_MONTH

  const rent = (inputs.squareFootage * inputs.grossRentPerSqFt) / 12
  const utilities = (inputs.squareFootage * inputs.utilitiesPerSqFt) / 12
  const food = steady.enrolled * inputs.foodCostPerChild
  const materials = steady.enrolled * inputs.materialsCostPerChild
  const franchiseFees =
    (grossMonthlyRevenue * (inputs.royaltyPercent + inputs.brandFundPercent + inputs.localMarketingPercent)) / 100
  const partnerSalaries = inputs.partnerASalary + inputs.partnerBSalary

  const bankDebt = (inputs.totalInvestment * inputs.debtPercent) / 100
  const equityRequired = inputs.totalInvestment - bankDebt
  const debtService = monthlyPayment(bankDebt, inputs.interestRate, inputs.amortizationYears)

  const totalMonthlyExpenses =
    payroll +
    rent +
    utilities +
    food +
    materials +
    inputs.insuranceMonthly +
    inputs.adminMonthly +
    franchiseFees +
    partnerSalaries +
    debtService

  const monthlyNet = grossMonthlyRevenue - totalMonthlyExpenses
  const annualNet = monthlyNet * 12
  const netMargin = grossMonthlyRevenue > 0 ? (monthlyNet / grossMonthlyRevenue) * 100 : 0

  // EBITDA: add back the interest portion of debt service (~interest-only at current rate)
  const monthlyInterest = (bankDebt * inputs.interestRate) / 100 / 12
  const ebitda = monthlyNet + monthlyInterest
  const ebitdaMargin = grossMonthlyRevenue > 0 ? (ebitda / grossMonthlyRevenue) * 100 : 0

  const partnerAEquity = (equityRequired * inputs.partnerAShare) / 100
  const partnerBEquity = equityRequired - partnerAEquity

  // --- monthly projection: build-out burn → ramp 50%→95% → stabilized ---
  const projection: MonthlyProjection[] = []
  let cumulative = 0
  let breakEvenMonth: number | null = null
  let paybackMonths: number | null = null
  const horizon = Math.max(inputs.buildOutMonths + inputs.rampMonths + 12, 120)

  for (let m = 1; m <= horizon; m++) {
    let occupancy: number
    let phase: MonthlyProjection['phase']
    if (m <= inputs.buildOutMonths) {
      phase = 'build-out'
      occupancy = 0
    } else if (m <= inputs.buildOutMonths + inputs.rampMonths) {
      phase = 'ramp'
      const t = (m - inputs.buildOutMonths - 1) / Math.max(inputs.rampMonths - 1, 1)
      occupancy = inputs.openingOccupancy + (inputs.stabilizedOccupancy - inputs.openingOccupancy) * t
    } else {
      phase = 'stabilized'
      occupancy = inputs.stabilizedOccupancy
    }

    let revenue = 0
    let expenses = 0
    let enrolled = 0
    let staff = 0

    if (phase === 'build-out') {
      expenses = rent + monthlyInterest + inputs.preOpeningBurn
    } else {
      const st = staffingFor(inputs.rooms, occupancy, inputs.occupancyDipOn)
      enrolled = st.enrolled
      staff = st.requiredRece + inputs.floaterCount + 1 + inputs.supportStaffCount
      const rev =
        inputs.rooms.reduce((sum, room, i) => sum + st.staffing[i].enrolled * room.tuition, 0) +
        inputs.additionalProgramsRevenue * (enrolled / Math.max(steady.enrolled, 1))
      revenue = rev
      const py =
        (st.requiredRece + inputs.floaterCount) * burdenedRece * HOURS_PER_MONTH +
        inputs.directorMonthlySalary +
        inputs.supportStaffCount * burdenedSupport * HOURS_PER_MONTH
      expenses =
        py +
        rent +
        utilities +
        enrolled * (inputs.foodCostPerChild + inputs.materialsCostPerChild) +
        inputs.insuranceMonthly +
        inputs.adminMonthly +
        (rev * (inputs.royaltyPercent + inputs.brandFundPercent + inputs.localMarketingPercent)) / 100 +
        partnerSalaries +
        debtService
    }

    const net = revenue - expenses
    cumulative += net
    if (breakEvenMonth === null && net >= 0 && phase !== 'build-out') breakEvenMonth = m
    if (paybackMonths === null && cumulative >= equityRequired && equityRequired > 0) paybackMonths = m

    projection.push({
      month: m,
      phase,
      occupancy,
      enrollment: enrolled,
      staff,
      revenue,
      expenses,
      net,
      cumulative,
    })
  }

  return {
    totalEnrolled: steady.enrolled,
    totalCapacity,
    occupancyRate: totalCapacity > 0 ? (steady.enrolled / totalCapacity) * 100 : 0,
    staffing: steady.staffing,
    requiredRece: steady.requiredRece,
    totalFte: steady.requiredRece + inputs.floaterCount + 1 + inputs.supportStaffCount,
    monthlyPayroll: payroll,
    laborPercent: grossMonthlyRevenue > 0 ? (payroll / grossMonthlyRevenue) * 100 : 0,

    grossMonthlyRevenue,
    annualRevenue,

    payroll,
    rent,
    utilities,
    food,
    materials,
    insurance: inputs.insuranceMonthly,
    admin: inputs.adminMonthly,
    franchiseFees,
    partnerSalaries,
    debtService,
    totalMonthlyExpenses,
    annualExpenses: totalMonthlyExpenses * 12,

    monthlyNet,
    annualNet,
    netMargin,
    ebitda,
    ebitdaMargin,

    totalInvestment: inputs.totalInvestment,
    bankDebt,
    equityRequired,
    partnerAEquity,
    partnerBEquity,

    breakEvenMonth,
    paybackMonths,
    projection,

    stressNotes,
  }
}

export const fmt = (n: number, digits = 0): string =>
  (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-CA', { maximumFractionDigits: digits, minimumFractionDigits: digits })

export const fmtSigned = (n: number): string => (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-CA', { maximumFractionDigits: 0 })
