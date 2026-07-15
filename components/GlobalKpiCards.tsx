'use client'

import { useEffect, useState } from 'react'
import { MapPin, Globe2, Flame, DollarSign } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { formatCompactNumber } from '@/lib/format-number'

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  return `$${formatCompactNumber(n)}`
}

export default function GlobalKpiCards() {
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    fetch('/data/live-stats.json').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  if (!stats) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="global-kpi-cards">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse h-24" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: 'Canadian sites',
      value: stats.siteCount.toLocaleString('en-CA'),
      sub: 'ECCC GHGRP verified',
      icon: MapPin,
      color: '#FF8C00',
    },
    {
      label: 'Provinces covered',
      value: String(stats.provinceCount),
      sub: 'Territories included',
      icon: Globe2,
      color: '#5BC0BE',
    },
    {
      label: 'Daily methane',
      value: `${formatCompactNumber(stats.totals.emissionKgDay)} kg`,
      sub: `${formatCompactNumber(stats.totals.ch4TonnesYear, 1)} t CH₄/yr`,
      icon: Flame,
      color: '#A78BFA',
    },
    {
      label: 'Model revenue',
      value: fmtUsd(stats.valueModel.annualRevenueUsd),
      sub: `@ $${stats.valueModel.defaultBtcUsd.toLocaleString()} BTC`,
      icon: DollarSign,
      color: '#34D399',
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="global-kpi-cards">
      {cards.map(card => (
        <div
          key={card.label}
          className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition"
          style={{ borderColor: `${card.color}33` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon size={16} style={{ color: card.color }} aria-hidden />
            <span className="text-[10px] uppercase tracking-wider text-gray-500">{card.label}</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  )
}