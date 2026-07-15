import type { LiveStats } from '@/types/live-stats'
import { formatCompactNumber } from '@/lib/format-number'
import { deploymentReadiness, liveModelRevenue } from '@/lib/dashboard-metrics'

export type HomeKpiItem = {
  key: string
  label: string
  value: string
  sub?: string
  href?: string
}

export type ReadinessMini = {
  score: number
  label: string
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-CA')}`
}

/** Compact emission label for cards (e.g. 12.4K kg/day). */
export function formatEmissionCompact(kgDay: number, decimals = 1): string {
  return `${formatCompactNumber(kgDay, decimals)} kg/day`
}

export function readinessMini(stats: LiveStats): ReadinessMini {
  const { score, label } = deploymentReadiness(stats)
  return { score, label }
}

/** KPI strip items for home hero area — sourced from live-stats + live BTC. */
export function homeKpiItems(stats: LiveStats, btcUsd: number): HomeKpiItem[] {
  const readiness = deploymentReadiness(stats)
  const revenue = liveModelRevenue(stats, btcUsd)

  return [
    {
      key: 'sites',
      label: 'Verified sites',
      value: stats.siteCount.toLocaleString(),
      sub: `${stats.provinceCount} provinces`,
      href: '/sites',
    },
    {
      key: 'emissions',
      label: 'CH₄ vented',
      value: formatCompactNumber(stats.totals.emissionKgDay, 2),
      sub: 'kg/day',
      href: '/dashboard',
    },
    {
      key: 'readiness',
      label: 'Deploy readiness',
      value: String(readiness.score),
      sub: readiness.label,
      href: '/dashboard',
    },
    {
      key: 'revenue',
      label: 'Model revenue',
      value: fmtUsd(revenue),
      sub: 'annual @ live BTC',
      href: '/pitch',
    },
    {
      key: 'co2e',
      label: 'CO₂e avoidable',
      value: formatCompactNumber(stats.impact.co2eAvoided100PctTonnes, 1),
      sub: 't/yr @ 100% capture',
      href: '/education',
    },
  ]
}

/** WebSite schema enrichment from live-stats. */
export function websiteSchemaExtras(stats: LiveStats) {
  const readiness = deploymentReadiness(stats)
  return {
    numberOfItems: stats.siteCount,
    aggregateRating: undefined,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://stranded.giveabit.io/map?site={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    about: {
      '@type': 'Thing',
      name: 'Canadian stranded methane sites',
      description: `${stats.siteCount} ECCC-verified sites · avg score ${stats.totals.avgStrandedScore} · deploy readiness ${readiness.score}/100`,
    },
  }
}