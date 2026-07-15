'use client'

import { useMemo } from 'react'
import type { LiveStats } from '@/types/live-stats'
import { formatCompactNumber } from '@/lib/format-number'
import { liveModelRevenue } from '@/lib/dashboard-metrics'

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-CA')}`
}

type Props = {
  stats: LiveStats
  btcUsd: number
}

export default function DashboardLiveTicker({ stats, btcUsd }: Props) {
  const { totals } = stats
  const revenue = useMemo(() => liveModelRevenue(stats, btcUsd), [stats, btcUsd])
  const megaLarge = (stats.emissionTiers.mega || 0) + (stats.emissionTiers.large || 0)

  const items = [
    { label: 'verified sites', value: stats.siteCount.toLocaleString('en-CA'), color: '#FF8C00' },
    { label: 'kg CH₄/day', value: formatCompactNumber(totals.emissionKgDay, 2), color: '#5BC0BE' },
    { label: 'avg score', value: String(totals.avgStrandedScore), color: '#34D399' },
    { label: 'mega + large', value: String(megaLarge), color: '#A78BFA' },
    { label: 'live BTC', value: fmtUsd(btcUsd), color: '#FBBF24' },
    { label: 'model revenue', value: fmtUsd(revenue), color: '#F472B6' },
    { label: 'provinces', value: String(stats.provinceCount), color: '#5BC0BE' },
    { label: 'high-score sites', value: String(totals.highScoreSites), color: '#FF8C00' },
  ]

  return (
    <div className="dashboard-ticker border-y border-white/10 bg-black/30 py-2.5" aria-label="Live KPI ticker">
      <div className="dashboard-ticker-track flex gap-10 whitespace-nowrap text-xs text-gray-400">
        {[...Array(2)].map((_, dup) => (
          <span key={dup} className="inline-flex shrink-0 items-center gap-10">
            {items.map(item => (
              <span key={`${dup}-${item.label}`}>
                <strong className="tabular-nums" style={{ color: item.color }}>
                  {item.value}
                </strong>{' '}
                {item.label}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}