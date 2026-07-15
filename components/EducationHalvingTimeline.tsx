'use client'

import { useMemo, useState } from 'react'
import { HALVING_SCHEDULE, projectBtcRevenue } from '@/lib/halving'

type Props = { dailyBtc?: number; btcUsd?: number }

export default function EducationHalvingTimeline({ dailyBtc = 0.01, btcUsd = 85000 }: Props) {
  const [yearIndex, setYearIndex] = useState(0)
  const projections = useMemo(() => projectBtcRevenue(dailyBtc, 12), [dailyBtc])
  const row = projections[yearIndex] ?? projections[0]
  const maxAnnual = Math.max(...projections.map(p => p.annualBtc * btcUsd), 1)

  return (
    <div className="glass p-6 rounded-2xl border border-[#FBBF24]/25">
      <h3 className="font-semibold mb-1 flex items-center gap-2 text-[#FBBF24]">Bitcoin Halving Timeline</h3>
      <p className="text-xs text-gray-400 mb-4">Drag to see how block reward reductions affect modeled BTC revenue (constant hashrate assumption).</p>

      <input
        type="range"
        min={0}
        max={projections.length - 1}
        value={yearIndex}
        onChange={e => setYearIndex(+e.target.value)}
        className="w-full accent-[#FBBF24]"
        aria-label="Projection year"
      />
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>{projections[0]?.year}</span>
        <span className="font-mono text-white">{row?.year}</span>
        <span>{projections[projections.length - 1]?.year}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-center text-sm">
        <div className="rounded-xl bg-black/25 p-3 border border-white/10">
          <div className="text-[10px] text-gray-500 uppercase">Reward factor</div>
          <div className="text-lg font-mono text-[#FBBF24]">{(row.halvingFactor * 100).toFixed(0)}%</div>
        </div>
        <div className="rounded-xl bg-black/25 p-3 border border-white/10">
          <div className="text-[10px] text-gray-500 uppercase">Annual BTC</div>
          <div className="text-lg font-mono text-white">{row.annualBtc.toFixed(3)}</div>
        </div>
        <div className="rounded-xl bg-black/25 p-3 border border-white/10">
          <div className="text-[10px] text-gray-500 uppercase">Annual USD</div>
          <div className="text-lg font-mono text-emerald-400">${Math.round(row.annualBtc * btcUsd).toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-end gap-1 h-20 mt-4">
        {projections.map((p, i) => {
          const usd = p.annualBtc * btcUsd
          const h = Math.max(6, (usd / maxAnnual) * 100)
          return (
            <button
              key={p.year}
              type="button"
              onClick={() => setYearIndex(i)}
              className={`flex-1 rounded-t transition-all ${i === yearIndex ? 'bg-[#FBBF24]' : 'bg-[#FBBF24]/40 hover:bg-[#FBBF24]/60'}`}
              style={{ height: `${h}%` }}
              title={`${p.year}: ${p.annualBtc.toFixed(3)} BTC`}
              aria-label={`Year ${p.year}`}
            />
          )
        })}
      </div>

      <ul className="mt-4 space-y-1 text-[10px] text-gray-500">
        {HALVING_SCHEDULE.slice(-3).map(h => (
          <li key={h.block}>
            <span className="text-gray-400">{h.date.slice(0, 4)}</span> · block {h.block.toLocaleString()} · {h.rewardBtc} BTC/block
          </li>
        ))}
      </ul>
    </div>
  )
}