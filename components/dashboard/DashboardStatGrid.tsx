'use client'

import {
  MapPin,
  Globe2,
  Flame,
  Bitcoin,
  BarChart3,
  Star,
  Leaf,
  DollarSign,
} from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { formatCompactNumber } from '@/lib/format-number'
import { liveModelRevenue } from '@/lib/dashboard-metrics'
import PitchStatCard from '@/components/pitch/PitchStatCard'

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

export default function DashboardStatGrid({ stats, btcUsd }: Props) {
  const { totals, impact } = stats
  const revenue = liveModelRevenue(stats, btcUsd)

  const cards = [
    {
      label: 'Verified Sites',
      value: stats.siteCount.toLocaleString('en-CA'),
      icon: MapPin,
      accent: '#FF8C00',
      delay: 0,
    },
    {
      label: 'Provinces',
      value: String(stats.provinceCount),
      sub: 'ECCC GHGRP coverage',
      icon: Globe2,
      accent: '#5BC0BE',
      delay: 0.04,
    },
    {
      label: 'Daily Methane',
      value: `${totals.emissionKgDay.toLocaleString('en-CA')} kg`,
      compactValue: `${formatCompactNumber(totals.emissionKgDay, 2)} kg`,
      sub: `${formatCompactNumber(totals.ch4TonnesYear, 1)} t CH₄/yr`,
      icon: Flame,
      accent: '#A78BFA',
      delay: 0.08,
    },
    {
      label: 'Live BTC',
      value: fmtUsd(btcUsd),
      sub: 'CoinGecko feed',
      icon: Bitcoin,
      accent: '#FBBF24',
      delay: 0.12,
    },
    {
      label: 'Avg Stranded Score',
      value: String(totals.avgStrandedScore),
      sub: `${totals.highScoreSites} sites ≥80`,
      icon: BarChart3,
      accent: '#34D399',
      delay: 0.16,
    },
    {
      label: 'High-Score Sites',
      value: String(totals.highScoreSites),
      sub: `${((totals.highScoreSites / stats.siteCount) * 100).toFixed(1)}% of portfolio`,
      icon: Star,
      accent: '#F472B6',
      delay: 0.2,
    },
    {
      label: '5% CO₂e Avoided',
      value: `${formatCompactNumber(impact.co2eAvoided5PctTonnes, 1)} t/yr`,
      sub: `~${impact.sitesAt5Pct} sites · GWP ${impact.methaneGwp}×`,
      icon: Leaf,
      accent: '#5BC0BE',
      delay: 0.24,
    },
    {
      label: 'Model Revenue',
      value: fmtUsd(revenue),
      sub: `${stats.valueModel.annualBtc.toFixed(1)} BTC/yr @ live price`,
      icon: DollarSign,
      accent: '#FF8C00',
      delay: 0.28,
    },
  ]

  return (
    <section className="mb-10" aria-label="Key performance indicators">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {cards.map(card => (
          <PitchStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            compactValue={card.compactValue}
            sub={card.sub}
            icon={card.icon}
            accent={card.accent}
            delay={card.delay}
          />
        ))}
      </div>
    </section>
  )
}