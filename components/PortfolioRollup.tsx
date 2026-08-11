'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { loadPortfolioIds } from '@/lib/portfolio'

type SiteLite = {
  id: string
  name?: string
  province?: string
  score?: number
  emission?: number
  potentialDailyProfitCAD?: number
}

export default function PortfolioRollup({ sites, className = '' }: { sites?: SiteLite[]; className?: string }) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(loadPortfolioIds())
  }, [])

  const resolved = useMemo(() => {
    if (sites?.length) return sites
    return ids.map(id => ({ id, name: id, score: 0, emission: 0 }))
  }, [sites, ids])

  if (!resolved.length) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`} data-testid="portfolio-rollup">
        <h3 className="font-semibold text-[#5BC0BE] mb-1">Mission portfolio</h3>
        <p className="text-sm text-gray-400 mb-3">No sites in mission yet.</p>
        <Link href="/map" className="text-sm text-[#FF8C00] hover:underline">
          Open map to build a mission →
        </Link>
      </div>
    )
  }

  const count = resolved.length
  const avgScore = Math.round(resolved.reduce((s, x) => s + (x.score || 0), 0) / count)
  const totalEmission = Math.round(resolved.reduce((s, x) => s + (x.emission || 0), 0))
  const dailyCad = Math.round(
    resolved.reduce((s, x) => s + (('potentialDailyProfitCAD' in x ? x.potentialDailyProfitCAD : 0) || 0), 0),
  )
  const missionParam = resolved.map(s => s.id).join(',')

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`} data-testid="portfolio-rollup">
      <h3 className="font-semibold text-[#5BC0BE] mb-3">Mission portfolio roll-up</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm mb-3">
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">Sites</div>
          <div className="font-mono text-lg">{count}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">Avg score</div>
          <div className="font-mono text-lg text-[#FF8C00]">{avgScore}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">kg/day</div>
          <div className="font-mono text-lg">{totalEmission.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">Daily CAD</div>
          <div className="font-mono text-lg text-[#34D399]">{dailyCad ? `$${dailyCad.toLocaleString()}` : '—'}</div>
        </div>
      </div>
      <Link
        href={`/map?mission=${encodeURIComponent(missionParam)}`}
        className="text-xs text-[#5BC0BE] hover:underline"
      >
        Open mission on map →
      </Link>
    </div>
  )
}
