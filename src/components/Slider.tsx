interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  hint?: string
}

export default function Slider({ label, value, min, max, step = 1, onChange, format, hint }: SliderProps) {
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold text-indigo-700 tabular-nums">
          {format ? format(value) : value.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        className="mt-1 w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
