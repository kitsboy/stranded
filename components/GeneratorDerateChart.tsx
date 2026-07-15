'use client'

import { useMemo } from 'react'
import { computeGeneratorPower, GensetId } from '@/lib/sites'

interface GeneratorDerateChartProps {
  emissionKgDay: number
  gensetId?: GensetId
  className?: string
}

export default function GeneratorDerateChart({
  emissionKgDay,
  gensetId = 'jenbacher316',
  className = '',
}: GeneratorDerateChartProps) {
  const points = useMemo(() => {
    const derates = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7]
    const base = computeGeneratorPower(emissionKgDay, gensetId, 1.0)
    return derates.map(d => ({
      derate: d,
      kw: Math.round(computeGeneratorPower(emissionKgDay, gensetId, d)),
      pct: base > 0 ? Math.round((computeGeneratorPower(emissionKgDay, gensetId, d) / base) * 100) : 0,
    }))
  }, [emissionKgDay, gensetId])

  const maxKw = Math.max(...points.map(p => p.kw), 1)

  return (
    <div className={`rounded-lg border border-white/10 bg-black/20 p-3 ${className}`}>
      <div className="text-xs font-semibold text-[#5BC0BE] mb-2">Generator derate impact</div>
      <div className="flex items-end gap-1 h-16">
        {points.map(p => (
          <div key={p.derate} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#5BC0BE] to-[#FF8C00]/60"
              style={{ height: `${(p.kw / maxKw) * 100}%`, minHeight: 3 }}
              title={`${(p.derate * 100).toFixed(0)}% derate → ${p.kw} kW`}
            />
            <span className="text-[7px] text-gray-500">{Math.round(p.derate * 100)}%</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-gray-500 mt-1">H₂S / treatment derate vs rated kW ({gensetId})</p>
    </div>
  )
}