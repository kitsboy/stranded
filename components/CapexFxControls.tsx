'use client'

import { useMemo, useState } from 'react'
import { scaleCapexWithFx } from '@/lib/capex-fx'

export default function CapexFxControls({
  baseCapexUsd = 1_000_000,
  className = '',
}: {
  baseCapexUsd?: number
  className?: string
}) {
  const [inflation, setInflation] = useState(3)
  const [years, setYears] = useState(2)
  const [usdCad, setUsdCad] = useState(1.36)
  const scaled = useMemo(
    () => scaleCapexWithFx(baseCapexUsd, inflation, years, usdCad),
    [baseCapexUsd, inflation, years, usdCad],
  )

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`} data-testid="capex-fx-controls">
      <h4 className="text-sm font-semibold text-[#FF8C00] mb-2">CapEx inflation + FX</h4>
      <p className="text-[10px] text-gray-500 mb-2">Base US${baseCapexUsd.toLocaleString()}</p>
      <label className="text-xs text-gray-400">Inflation {inflation}%/yr · {years}y</label>
      <input type="range" min={0} max={12} value={inflation} onChange={e => setInflation(+e.target.value)} className="w-full accent-[#FF8C00]" aria-label="Inflation percent" />
      <input type="range" min={0} max={5} value={years} onChange={e => setYears(+e.target.value)} className="w-full accent-[#5BC0BE] mt-1" aria-label="Years until spend" />
      <label className="text-xs text-gray-400 mt-2 block">USD/CAD {usdCad.toFixed(2)}</label>
      <input type="range" min={1.2} max={1.6} step={0.01} value={usdCad} onChange={e => setUsdCad(+e.target.value)} className="w-full accent-amber-400" aria-label="USD CAD rate" />
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">USD</div>
          <div className="font-mono">${scaled.usd.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">CAD</div>
          <div className="font-mono text-[#5BC0BE]">C${scaled.cad.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
