'use client'

import { emissionLinearToLog, emissionLogToLinear } from '@/lib/map-filters'

interface DualRangeSliderProps {
  min: number
  max: number
  step?: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  className?: string
  /** Log-scale thumb positions (#313) */
  logScale?: boolean
}

export default function DualRangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  className = '',
  logScale = false,
}: DualRangeSliderProps) {
  const lo = Math.min(valueMin, valueMax)
  const hi = Math.max(valueMin, valueMax)

  const sliderMin = logScale ? 0 : min
  const sliderMax = logScale ? 1000 : max
  const sliderStep = logScale ? 1 : step
  const loPos = logScale ? emissionLinearToLog(lo, max) : lo
  const hiPos = logScale ? emissionLinearToLog(hi, max) : hi

  const range = sliderMax - sliderMin || 1
  const loPct = ((loPos - sliderMin) / range) * 100
  const hiPct = ((hiPos - sliderMin) / range) * 100

  const emit = (loV: number, hiV: number) => {
    if (logScale) {
      onChange(emissionLogToLinear(loV, max), emissionLogToLinear(hiV, max))
    } else {
      onChange(loV, hiV)
    }
  }

  const handleMin = (v: number) => emit(Math.min(v, hiPos), hiPos)
  const handleMax = (v: number) => emit(loPos, Math.max(v, loPos))

  const inset = 'left-[7px] right-[7px] w-[calc(100%-14px)]'

  return (
    <div className={`relative h-6 overflow-hidden ${className}`} data-testid="dual-range-slider">
      <div className={`absolute top-1/2 -translate-y-1/2 ${inset} h-1.5 rounded-full bg-white/10`} />
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[#FF8C00]/70`}
        style={{ left: `calc(7px + (100% - 14px) * ${loPct / 100})`, width: `calc((100% - 14px) * ${(hiPct - loPct) / 100})` }}
      />
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={loPos}
        onChange={e => handleMin(+e.target.value)}
        className={`dual-range-thumb absolute inset-y-0 ${inset} appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto`}
        aria-label="Minimum emission"
      />
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={hiPos}
        onChange={e => handleMax(+e.target.value)}
        className={`dual-range-thumb absolute inset-y-0 ${inset} appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto`}
        aria-label="Maximum emission"
      />
    </div>
  )
}