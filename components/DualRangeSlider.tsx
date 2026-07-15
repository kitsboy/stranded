'use client'

interface DualRangeSliderProps {
  min: number
  max: number
  step?: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  className?: string
}

export default function DualRangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  className = '',
}: DualRangeSliderProps) {
  const lo = Math.min(valueMin, valueMax)
  const hi = Math.max(valueMin, valueMax)
  const range = max - min || 1
  const loPct = ((lo - min) / range) * 100
  const hiPct = ((hi - min) / range) * 100

  const handleMin = (v: number) => onChange(Math.min(v, hi), hi)
  const handleMax = (v: number) => onChange(lo, Math.max(v, lo))

  return (
    <div className={`relative h-6 ${className}`}>
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-white/10" />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[#FF8C00]/70"
        style={{ left: `${loPct}%`, width: `${hiPct - loPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={e => handleMin(+e.target.value)}
        className="dual-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
        aria-label="Minimum emission"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={e => handleMax(+e.target.value)}
        className="dual-range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
        aria-label="Maximum emission"
      />
    </div>
  )
}