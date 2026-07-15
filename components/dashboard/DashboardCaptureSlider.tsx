'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gauge, Leaf, Bitcoin, Zap } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { captureAtPct } from '@/lib/dashboard-metrics'
import { formatCompactNumber } from '@/lib/format-number'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'

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

export default function DashboardCaptureSlider({ stats, btcUsd }: Props) {
  const { locale, t } = useLocale()
  const [capturePct, setCapturePct] = useState(5)

  const projection = useMemo(
    () => captureAtPct(stats, capturePct, btcUsd),
    [stats, capturePct, btcUsd],
  )

  const tiles = [
    { icon: Gauge, label: t('dashboardCaptureSites'), value: projection.sites.toLocaleString('en-CA'), accent: '#FF8C00' },
    { icon: Leaf, label: t('dashboardCaptureCo2e'), value: `${formatCompactNumber(projection.co2eTonnes, 1)} t/yr`, accent: '#5BC0BE' },
    { icon: Bitcoin, label: t('dashboardCaptureBtc'), value: `${projection.btcYr.toFixed(1)} BTC/yr`, accent: '#FBBF24' },
    { icon: Zap, label: t('dashboardCaptureRevenue'), value: fmtUsd(projection.revenueUsd), accent: '#F472B6' },
  ]

  return (
    <section className="dashboard-panel mb-10" aria-labelledby="dashboard-capture-heading">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="dashboard-capture-heading" className="text-xl font-bold">
            {t('dashboardCaptureTitle')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('dashboardCaptureSubtitle')}
          </p>
        </div>
        <div className="rounded-full border border-[#FF8C00]/30 bg-[#FF8C00]/10 px-4 py-1.5 text-sm font-semibold tabular-nums text-[#FF8C00]">
          {tf(locale, 'dashboardCapturePctSites', { pct: capturePct, sites: projection.sites.toLocaleString('en-CA') })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-5 md:p-6">
        <label className="mb-2 flex items-center justify-between text-xs text-gray-400">
          <span>{t('dashboardCaptureRate')}</span>
          <span className="font-semibold text-white">{capturePct}%</span>
        </label>
        <input
          type="range"
          min={1}
          max={100}
          value={capturePct}
          onChange={e => setCapturePct(+e.target.value)}
          className="pitch-range w-full accent-[#FF8C00]"
          aria-label="Portfolio capture percentage"
        />
        <div className="mt-1 flex justify-between text-[10px] text-gray-600">
          <span>1%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.label}
              layout
              className="rounded-xl border border-white/10 bg-black/20 p-3.5"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <tile.icon className="mb-1.5 h-4 w-4 opacity-60" style={{ color: tile.accent }} aria-hidden />
              <div className="text-[10px] uppercase tracking-wider text-gray-500">{tile.label}</div>
              <div className="mt-1 text-base font-bold tabular-nums sm:text-lg" style={{ color: tile.accent }}>
                {tile.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}