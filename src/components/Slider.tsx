import { useState } from 'react'

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
  const [text, setText] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)

  // keep the input box in sync when the slider (or randomize) changes the value
  if (value !== lastValue) {
    setLastValue(value)
    if (Number(text) !== value) setText(String(value))
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="flex items-center gap-2">
          <input
            type="number"
            className="w-24 rounded-md border border-slate-300 px-2 py-0.5 text-right text-sm font-semibold text-indigo-700 tabular-nums focus:border-indigo-500 focus:outline-none"
            min={min}
            max={max}
            step={step}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              const n = Number(e.target.value)
              if (e.target.value !== '' && !Number.isNaN(n)) onChange(clamp(n))
            }}
            onBlur={() => setText(String(value))}
          />
          {format && (
            <span className="w-28 text-right text-xs text-slate-500 tabular-nums">{format(value)}</span>
          )}
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
