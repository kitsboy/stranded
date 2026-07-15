'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Radar,
  Target,
  Factory,
  ShieldCheck,
  Zap,
  MapPin,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import {
  deploymentReadiness,
  provinceRevenueLeaders,
} from '@/lib/dashboard-metrics'
import { formatCompactNumber } from '@/lib/format-number'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'

const COLORS = ['#FF8C00', '#5BC0BE', '#A78BFA', '#34D399', '#F472B6']

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-CA')}`
}

function ReadinessGauge({ score, label, readinessLabel }: { score: number; label: string; readinessLabel: string }) {
  const r = 54
  const c = 2 * Math.PI * r
  const dash = (score / 100) * c
  const color = score >= 85 ? '#34D399' : score >= 70 ? '#FF8C00' : score >= 55 ? '#FBBF24' : '#94a3b8'

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90" aria-hidden>
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <motion.circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            whileInView={{ strokeDashoffset: c - dash }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-gray-500">/ 100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color }}>
        {label}
      </p>
      <p className="text-[10px] text-gray-500">{readinessLabel}</p>
    </div>
  )
}

type FactorTileProps = {
  icon: LucideIcon
  label: string
  value: string
  sub: string
  accent: string
  delay: number
}

function FactorTile({ icon: Icon, label, value, sub, accent, delay }: FactorTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">{label}</span>
        <Icon className="h-4 w-4 shrink-0 opacity-60" style={{ color: accent }} aria-hidden />
      </div>
      <div className="text-xl font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
      <p className="mt-1 text-[10px] text-gray-500">{sub}</p>
    </motion.div>
  )
}

type Props = {
  stats: LiveStats
}

export default function DashboardOpportunityRadar({ stats }: Props) {
  const { locale, t } = useLocale()
  const readiness = useMemo(() => deploymentReadiness(stats), [stats])
  const leaders = useMemo(() => provinceRevenueLeaders(stats, 5), [stats])

  const megaLargeCount =
    (stats.emissionTiers.mega || 0) + (stats.emissionTiers.large || 0)
  const highConfPct = readiness.factors.find(f => f.name === 'confidence')?.value ?? 0
  const highScorePct = readiness.factors.find(f => f.name === 'highScore')?.value ?? 0
  const genGw = stats.totals.totalGeneratorKW / 1_000_000
  const topRevenue = leaders[0]?.revenueUsd || 1

  const factorTiles: FactorTileProps[] = [
    {
      icon: Target,
      label: t('dashboardOpportunityRadarHighScore'),
      value: `${highScorePct.toFixed(1)}%`,
      sub: tf(locale, 'dashboardOpportunityRadarHighScoreSub', { count: stats.totals.highScoreSites }),
      accent: '#FF8C00',
      delay: 0.05,
    },
    {
      icon: Factory,
      label: t('dashboardOpportunityRadarMegaLarge'),
      value: String(megaLargeCount),
      sub: tf(locale, 'dashboardOpportunityRadarMegaLargeSub', { pct: ((megaLargeCount / stats.siteCount) * 100).toFixed(1) }),
      accent: '#5BC0BE',
      delay: 0.1,
    },
    {
      icon: ShieldCheck,
      label: t('dashboardOpportunityRadarHighConfidence'),
      value: `${highConfPct.toFixed(1)}%`,
      sub: tf(locale, 'dashboardOpportunityRadarHighConfSub', { count: stats.confidenceCounts.high || 0 }),
      accent: '#34D399',
      delay: 0.15,
    },
    {
      icon: Zap,
      label: t('dashboardOpportunityRadarGenCapacity'),
      value: `${genGw.toFixed(2)} GW`,
      sub: tf(locale, 'dashboardOpportunityRadarGenCapSub', { kw: formatCompactNumber(stats.totals.totalGeneratorKW, 1) }),
      accent: '#A78BFA',
      delay: 0.2,
    },
  ]

  return (
    <section className="mb-10" data-testid="dashboard-opportunity-radar" aria-labelledby="opportunity-radar-heading">
      <div className="mb-6 flex items-center gap-2">
        <Radar className="h-5 w-5 text-[#FF8C00]" aria-hidden />
        <div>
          <h2 id="opportunity-radar-heading" className="text-xl font-bold">
            {t('dashboardOpportunityRadarTitle')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('dashboardOpportunityRadarSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="pitch-panel flex flex-col items-center justify-center rounded-2xl border border-[#FF8C00]/20 bg-gradient-to-br from-[#FF8C00]/08 via-white/[0.02] to-[#5BC0BE]/05 p-6"
        >
          <ReadinessGauge score={readiness.score} label={readiness.label} readinessLabel={t('dashboardOpportunityRadarReadiness')} />
          <div className="mt-6 w-full space-y-2">
            {readiness.factors.map(f => (
              <div key={f.name} className="text-xs">
                <div className="mb-1 flex justify-between gap-2 text-gray-400">
                  <span className="truncate">{f.label}</span>
                  <span className="shrink-0 tabular-nums">{f.value.toFixed(1)}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#5BC0BE]"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(100, f.value)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {factorTiles.map(tile => (
              <FactorTile key={tile.label} {...tile} />
            ))}
          </div>

          <div className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#5BC0BE]" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#5BC0BE]">
                {t('dashboardOpportunityRadarTopProvinces')}
              </h3>
            </div>
            <div className="space-y-3">
              {leaders.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 text-gray-300">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: `${COLORS[i % COLORS.length]}22`,
                          color: COLORS[i % COLORS.length],
                        }}
                      >
                        {i + 1}
                      </span>
                      <MapPin className="h-3 w-3 shrink-0 text-gray-500" aria-hidden />
                      <Link
                        href={`/provinces?name=${encodeURIComponent(p.name)}`}
                        className="truncate hover:text-[#5BC0BE] hover:underline"
                      >
                        {p.name}
                      </Link>
                    </span>
                    <span className="shrink-0 tabular-nums text-gray-400">
                      <span className="font-semibold text-[#F472B6]">{fmtUsd(p.revenueUsd)}</span>
                      <span className="ml-1 text-gray-500">{t('dashboardOpportunityRadarPerYear')}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]}88)`,
                      }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(p.revenueUsd / topRevenue) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
                    <span>{p.sites} sites</span>
                    <span>{formatCompactNumber(p.emissionKgDay, 1)} kg/day</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}