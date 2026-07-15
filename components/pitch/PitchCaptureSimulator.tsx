'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gauge, Leaf, Bitcoin, Zap } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { portfolioCaptureProjection } from '@/lib/pitch-metrics'
import { formatCompactNumber } from '@/lib/format-number'

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-CA')}`
}

type Props = {
  stats: LiveStats
  capturePct: number
  onCaptureChange: (pct: number) => void
  liveRevenueUsd: number
  title: string
  desc: string
  sitesLabel: string
  co2eLabel: string
  btcLabel: string
  revenueLabel: string
  powerLabel: string
}

export default function PitchCaptureSimulator({
  stats,
  capturePct,
  onCaptureChange,
  liveRevenueUsd,
  title,
  desc,
  sitesLabel,
  co2eLabel,
  btcLabel,
  revenueLabel,
  powerLabel,
}: Props) {
  const projection = useMemo(
    () => portfolioCaptureProjection(stats, capturePct),
    [stats, capturePct],
  )

  const revenueAtLive = useMemo(() => {
    const ratio = stats.valueModel.annualRevenueUsd > 0
      ? liveRevenueUsd / stats.valueModel.annualRevenueUsd
      : 1
    return Math.round(projection.revenueUsd * ratio)
  }, [projection.revenueUsd, liveRevenueUsd, stats.valueModel.annualRevenueUsd])

  const tiles = [
    { icon: Gauge, label: sitesLabel, value: projection.sites.toLocaleString('en-CA'), accent: '#FF8C00' },
    { icon: Leaf, label: co2eLabel, value: `${formatCompactNumber(projection.co2eTonnes, 1)} t`, accent: '#5BC0BE' },
    { icon: Bitcoin, label: btcLabel, value: `${projection.btcYr.toFixed(1)} BTC`, accent: '#FBBF24' },
    { icon: Zap, label: revenueLabel, value: fmtUsd(revenueAtLive), accent: '#F472B6' },
  ]

  return (
    <section className="pitch-capture px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{desc}</p>
          </div>
          <div className="pitch-capture-pill rounded-full border border-[#FF8C00]/30 bg-[#FF8C00]/10 px-4 py-2 text-sm font-semibold tabular-nums text-[#FF8C00]">
            {capturePct}% · {projection.sites.toLocaleString('en-CA')} sites
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 md:p-8">
          <label className="mb-3 flex items-center justify-between text-xs text-gray-400">
            <span>Portfolio capture rate</span>
            <span className="font-semibold text-white">{capturePct}%</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={capturePct}
            onChange={e => onCaptureChange(+e.target.value)}
            className="pitch-range w-full accent-[#FF8C00]"
            aria-label="Portfolio capture percentage"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-600">
            <span>1%</span>
            <span>50%</span>
            <span>100%</span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((tile, i) => (
              <motion.div
                key={tile.label}
                layout
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <tile.icon className="mb-2 h-4 w-4 opacity-60" style={{ color: tile.accent }} />
                <div className="text-[10px] uppercase tracking-wider text-gray-500">{tile.label}</div>
                <div
                  className="mt-1 text-lg font-bold tabular-nums sm:text-xl"
                  style={{ color: tile.accent }}
                >
                  {tile.value}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-5 text-xs text-gray-500">
            {powerLabel}: <span className="text-gray-300">{formatCompactNumber(projection.generatorKw, 1)} kW</span> estimated generator capacity at this capture rate.
          </p>
        </div>
      </div>
    </section>
  )
}