'use client'

import { useMemo, useState } from 'react'

interface BreakevenCalculatorProps {
  defaultCapexUsd?: number
  defaultDailyRevenueCad?: number
  className?: string
}

export default function BreakevenCalculator({
  defaultCapexUsd = 2_500_000,
  defaultDailyRevenueCad = 12_000,
  className = '',
}: BreakevenCalculatorProps) {
  const [capexUsd, setCapexUsd] = useState(defaultCapexUsd)
  const [dailyRevenueCad, setDailyRevenueCad] = useState(defaultDailyRevenueCad)
  const [opexPct, setOpexPct] = useState(18)

  const result = useMemo(() => {
    const dailyNet = dailyRevenueCad * (1 - opexPct / 100)
    const monthlyNet = dailyNet * 30
    const months = monthlyNet > 0 ? capexUsd / monthlyNet : Infinity
    const years = months / 12
    return { dailyNet, monthlyNet, months, years }
  }, [capexUsd, dailyRevenueCad, opexPct])

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      <h3 className="font-semibold text-[#FF8C00] mb-3">CapEx vs Revenue Breakeven</h3>
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs text-gray-400">Total CapEx (USD): ${capexUsd.toLocaleString()}</label>
          <input type="range" min={250000} max={15000000} step={50000} value={capexUsd} onChange={e => setCapexUsd(+e.target.value)} className="w-full accent-[#FF8C00] mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Daily revenue (CAD): C${dailyRevenueCad.toLocaleString()}</label>
          <input type="range" min={500} max={80000} step={500} value={dailyRevenueCad} onChange={e => setDailyRevenueCad(+e.target.value)} className="w-full accent-[#5BC0BE] mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-400">Opex + pool drag: {opexPct}%</label>
          <input type="range" min={5} max={40} value={opexPct} onChange={e => setOpexPct(+e.target.value)} className="w-full accent-amber-400 mt-1" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/10 p-3">
          <div className="text-[10px] uppercase text-gray-400">Breakeven</div>
          <div className="text-2xl font-bold text-[#FF8C00] tabular-nums">
            {Number.isFinite(result.months) ? `${result.months.toFixed(1)} mo` : '—'}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[10px] uppercase text-gray-400">Net daily</div>
          <div className="text-2xl font-bold text-[#5BC0BE] tabular-nums">C${Math.round(result.dailyNet).toLocaleString()}</div>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 mt-3">Simple payback: CapEx ÷ (net daily × 30). Illustrative — excludes debt service &amp; halving.</p>
    </div>
  )
}