'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Map,
  Presentation,
  DollarSign,
  GraduationCap,
  GitCompare,
  List,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScoreHistogram from '@/components/ScoreHistogram'
import DashboardHero from '@/components/dashboard/DashboardHero'
import DashboardStatGrid from '@/components/dashboard/DashboardStatGrid'
import DashboardOpportunityRadar from '@/components/dashboard/DashboardOpportunityRadar'
import DashboardLiveTicker from '@/components/dashboard/DashboardLiveTicker'
import DashboardCaptureSlider from '@/components/dashboard/DashboardCaptureSlider'
import DashboardEmissionTiers from '@/components/dashboard/DashboardEmissionTiers'
import DashboardSourceMix from '@/components/dashboard/DashboardSourceMix'
import DashboardGensetMix from '@/components/dashboard/DashboardGensetMix'
import DashboardConfidencePanel from '@/components/dashboard/DashboardConfidencePanel'
import type { LiveStats } from '@/types/live-stats'
import { useBtcUsd } from '@/components/BtcPriceProvider'
import { downloadBlob } from '@/lib/export-formats'
import { emissionTierItems } from '@/lib/dashboard-metrics'
import { scoreTierClass, scorePercentile, scoreBadgeLabel } from '@/lib/scoring'
import { markPageReady } from '@/lib/performance'

const CARBON_SCENARIOS = [20, 50, 80] as const

const TIER_LEADER_COLORS: Record<string, string> = {
  mega: '#a855f7',
  large: '#FF8C00',
  medium: '#5BC0BE',
  small: '#34D399',
  micro: '#94a3b8',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [allScores, setAllScores] = useState<number[]>([])
  const btc = useBtcUsd()

  useEffect(() => {
    const refresh = () => {
      fetch('/data/live-stats.json')
        .then(r => {
          if (!r.ok) throw new Error('stats')
          return r.json()
        })
        .then(s => { setStats(s); setLoadError(false); markPageReady('dashboard') })
        .catch(() => setLoadError(true))
    }
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetch('/data/stranded-sites.geojson')
      .then(r => r.json())
      .then((geo: { features?: { properties?: { stranded_score?: number } }[] }) => {
        const scores = (geo.features || [])
          .map(f => (f.properties as { stranded_score?: number })?.stranded_score)
          .filter((s): s is number => typeof s === 'number')
        if (scores.length) setAllScores(scores)
      })
      .catch(() => {
        if (stats?.topSites) setAllScores(stats.topSites.map(s => s.score))
      })
  }, [stats])

  const histogramScores = useMemo(() => {
    if (allScores.length) return allScores
    if (!stats?.scoreHistogram?.length) return []
    const expanded: number[] = []
    stats.scoreHistogram.forEach((b, i) => {
      const mid = i * 10 + 5
      for (let j = 0; j < b.count; j++) expanded.push(mid + (j % 3) - 1)
    })
    return expanded
  }, [allScores, stats])

  const carbonScenarios = useMemo(() => {
    if (!stats) return null
    const tonnes5 = stats.impact.co2eAvoided5PctTonnes
    return CARBON_SCENARIOS.map(price => ({
      price,
      usd5: Math.round(tonnes5 * price),
      tonnes5,
    }))
  }, [stats])

  const emissionTiers = useMemo(
    () => (stats ? emissionTierItems(stats) : []),
    [stats],
  )

  const exportTop10 = () => {
    if (!stats?.topSites?.length) return
    const top = stats.topSites.slice(0, 10)
    const header = 'id,name,province,score,emission_kg_day,genset'
    const rows = top.map(s =>
      [s.id, `"${(s.name || '').replace(/"/g, '""')}"`, s.province, s.score, s.emissionKgDay, s.genset].join(',')
    )
    downloadBlob([header, ...rows].join('\n'), 'stranded-top-10-sites.csv', 'text/csv')
  }

  const exportLiveStatsJson = () => {
    if (!stats) return
    downloadBlob(JSON.stringify(stats, null, 2), 'stranded-live-stats.json', 'application/json')
  }

  if (loadError && !stats) {
    return (
      <div className="p-12 text-center space-y-3" role="alert">
        <p className="text-red-400">Could not load dashboard stats.</p>
        <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold">Retry</button>
      </div>
    )
  }
  if (!stats) return <div className="p-12 text-center text-gray-400" role="status">Loading command dashboard…</div>

  const topTwo = stats.topSites.slice(0, 2)
  const compareHref = topTwo.length >= 2
    ? `/compare?a=${encodeURIComponent(topTwo[0].id)}&b=${encodeURIComponent(topTwo[1].id)}`
    : null

  return (
    <div className="dashboard-page">
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />
      </div>

      <div className="dashboard-hero-bleed">
        <div className="mx-auto max-w-6xl px-6">
          <DashboardHero stats={stats} onExportJson={exportLiveStatsJson} />
        </div>
      </div>

      <DashboardLiveTicker stats={stats} btcUsd={btc} />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <DashboardStatGrid stats={stats} btcUsd={btc} />
        <DashboardOpportunityRadar stats={stats} />
        <DashboardCaptureSlider stats={stats} btcUsd={btc} />

        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <DashboardEmissionTiers stats={stats} />
          <DashboardSourceMix stats={stats} />
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <DashboardGensetMix stats={stats} />
          <DashboardConfidencePanel stats={stats} />
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="dashboard-panel rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 font-semibold">Score Distribution</h2>
            <ScoreHistogram scores={histogramScores.length ? histogramScores : Array.from({ length: stats.siteCount }, (_, i) => stats.totals.avgStrandedScore + (i % 20) - 10)} />
          </div>
          <div className="dashboard-panel rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 font-semibold">Province Comparison</h2>
            <div className="space-y-2">
              {stats.provinces.slice(0, 8).map((p, i) => {
                const max = stats.provinces[0]?.count || 1
                return (
                  <div key={p.name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate pr-2 text-gray-300">{p.name}</span>
                      <span className="shrink-0 tabular-nums text-gray-400">{p.count} ({p.pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#5BC0BE]"
                        style={{ width: `${(p.count / max) * 100}%`, opacity: 1 - i * 0.06 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-[#34D399]/25 bg-[#34D399]/5 p-5">
          <h2 className="mb-3 font-semibold text-[#34D399]">Carbon Credit Scenarios (5% capture)</h2>
          {carbonScenarios && (
            <div className="grid gap-4 text-sm sm:grid-cols-3">
              {carbonScenarios.map(c => (
                <div key={c.price} className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                  <div className="text-[10px] uppercase text-gray-500">${c.price}/t CO₂e</div>
                  <div className="mt-1 text-xl font-bold tabular-nums text-[#34D399]">${c.usd5.toLocaleString()}/yr</div>
                  <div className="mt-1 text-xs text-gray-500">{c.tonnes5.toLocaleString()} t</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10px] text-gray-500">Side-by-side $20 / $50 / $80 per tonne — illustrative market bands.</p>
        </div>

        <div className="dashboard-panel mb-8 rounded-2xl border border-white/10 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Top 10 Sites</h2>
            <div className="flex flex-wrap gap-2">
              {compareHref && (
                <Link
                  href={compareHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#5BC0BE]/40 bg-[#5BC0BE]/10 px-3 py-1.5 text-xs text-[#5BC0BE] hover:bg-[#5BC0BE]/20"
                >
                  <GitCompare className="h-3.5 w-3.5" aria-hidden />
                  Compare top 2
                </Link>
              )}
              <button
                type="button"
                onClick={exportTop10}
                className="rounded-lg border border-[#FF8C00]/40 bg-[#FF8C00]/20 px-3 py-1.5 text-xs text-[#FF8C00] hover:bg-[#FF8C00]/30"
              >
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="pb-2 pr-3">#</th>
                  <th className="pb-2 pr-3">Site</th>
                  <th className="pb-2 pr-3">Province</th>
                  <th className="pb-2 pr-3">Score</th>
                  <th className="pb-2">kg/day</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSites.slice(0, 10).map((s, i) => {
                  const badge = histogramScores.length
                    ? scoreBadgeLabel(scorePercentile(s.score, histogramScores))
                    : ''
                  return (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                      <td className="py-2 pr-3">
                        <Link href={`/map?site=${s.id}`} className="block max-w-[200px] truncate text-[#5BC0BE] hover:underline">{s.name}</Link>
                      </td>
                      <td className="py-2 pr-3 text-gray-400">{s.province}</td>
                      <td className="py-2 pr-3">
                        <span className={`stranded-score inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs ${scoreTierClass(s.score)}`}>
                          {s.score}
                          {badge && (
                            <span className="rounded bg-white/10 px-1 py-px text-[9px] font-normal text-gray-300">
                              {badge}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-gray-400">{s.emissionKgDay.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-panel mb-6 rounded-2xl border border-white/10 p-5">
          <h2 className="mb-4 font-semibold">Emission Tier Leaders</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {emissionTiers.map(tier => {
              const color = TIER_LEADER_COLORS[tier.key] || '#94a3b8'
              return (
                <div
                  key={tier.key}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  style={{ borderColor: `${color}33` }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">{tier.label.split(' ')[0]}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums" style={{ color }}>
                      {tier.count.toLocaleString('en-CA')}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{tier.pct}%</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${tier.pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="dashboard-panel rounded-2xl border border-white/10 p-5">
            <h2 className="mb-4 font-semibold">Top Provinces</h2>
            {stats.provinces.slice(0, 6).map(p => (
              <Link key={p.name} href={`/provinces?name=${encodeURIComponent(p.name)}`} className="flex justify-between border-b border-white/5 py-2 text-sm hover:text-[#FF8C00]">
                <span>{p.name}</span><span className="text-gray-400">{p.count} ({p.pct}%)</span>
              </Link>
            ))}
          </div>
          <div className="dashboard-panel rounded-2xl border border-white/10 p-5">
            <h2 className="mb-4 font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link href="/map" className="flex items-center justify-center gap-2 rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/10 p-3 text-center hover:bg-[#FF8C00]/20">
                <Map className="h-4 w-4 shrink-0" aria-hidden />
                Map
              </Link>
              <Link href="/sites" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center hover:bg-white/10">
                <List className="h-4 w-4 shrink-0" aria-hidden />
                Sites
              </Link>
              <Link href="/compare" className="flex items-center justify-center gap-2 rounded-xl border border-[#5BC0BE]/30 bg-[#5BC0BE]/10 p-3 text-center hover:bg-[#5BC0BE]/20">
                <GitCompare className="h-4 w-4 shrink-0" aria-hidden />
                Compare
              </Link>
              <Link href="/education" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center hover:bg-white/10">
                <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
                Education
              </Link>
              <Link href="/pitch" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center hover:bg-white/10">
                <Presentation className="h-4 w-4 shrink-0" aria-hidden />
                Pitch
              </Link>
              <Link href="/funding" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center hover:bg-white/10">
                <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
                Funding
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}