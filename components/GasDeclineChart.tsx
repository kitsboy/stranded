'use client'

import { useMemo, useState } from 'react'
import { projectGasDecline, cumulativeCapture } from '@/lib/gas-decline'

export default function GasDeclineChart({
  emissionKgDay,
  baseDailyCad = 0,
  className = '',
}: {
  emissionKgDay: number
  baseDailyCad?: number
  className?: string
}) {
  const [decline, setDecline] = useState(15)
  const years = 10
  const pts = useMemo(() => projectGasDecline(emissionKgDay, decline, years), [emissionKgDay, decline])
  const maxEm = Math.max(...pts.map(p => p.emission), 1)
  const cum = useMemo(
    () => (baseDailyCad > 0 ? cumulativeCapture(baseDailyCad, decline, years) : null),
    [baseDailyCad, decline],
  )

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`} data-testid="gas-decline-chart">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-[#FF8C00]">Gas decline scenario</h4>
        <span className="text-[11px] font-mono text-gray-400">{decline}%/yr</span>
      </div>
      <input
        type="range"
        min={0}
        max={40}
        value={decline}
        onChange={e => setDecline(+e.target.value)}
        className="w-full accent-[#FF8C00] mb-3"
        aria-label="Annual gas decline percent"
      />
      <div className="flex items-end gap-1 h-24">
        {pts.map(p => (
          <div key={p.year} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#FF8C00]/80 to-[#5BC0BE]/60 min-h-[2px]"
              style={{ height: `${(p.emission / maxEm) * 100}%` }}
              title={`Y${p.year}: ${p.emission} kg/day`}
            />
            <span className="text-[8px] text-gray-500">{p.year}</span>
          </div>
        ))}
      </div>
      {cum != null && (
        <p className="mt-2 text-[10px] text-gray-400">
          Cumulative model revenue @ decline: <span className="text-white font-mono">C${cum.toLocaleString()}</span>
        </p>
      )}
    </div>
  )
}
