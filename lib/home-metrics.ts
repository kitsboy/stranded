import type { LiveStats } from '@/types/live-stats'
import { formatCompactNumber } from '@/lib/format-number'
import { deploymentReadiness, liveModelRevenue } from '@/lib/dashboard-metrics'

export type HomeKpiItem = {
  key: string
  label: string
  value: string
  sub?: string
  href?: string
  /** Rich ELI16 tooltip copy (design-tokens: data-tip + data-tip-title) */
  tipTitle?: string
  tip?: string
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
      label: 'Mapped sites',
      value: stats.siteCount.toLocaleString(),
      sub: `${(stats.withReportedCh4 ?? 2588).toLocaleString()} with reported CH₄ · ${(stats.highConfidenceWithEmission ?? 675).toLocaleString()} high-confidence`,
      href: '/sites',
      tipTitle: 'Mapped sites — honest split',
      tip: `${stats.siteCount.toLocaleString()} locations mapped from ECCC open data, of which ${(stats.withReportedCh4 ?? 2588).toLocaleString()} carry a reported CH₄ figure and ${(stats.highConfidenceWithEmission ?? 675).toLocaleString()} are high-confidence and emission-bearing. "Verified" is only used for that high-confidence set, never the whole file.`,
    },
    {
      key: 'emissions',
      label: 'CH₄ vented',
      value: formatCompactNumber(stats.totals.emissionKgDay, 2),
      sub: 'kg/day',
      href: '/dashboard',
      tipTitle: 'Methane vented daily',
      tip: 'Methane is 25× more potent than CO₂ over 100 years. This is how much is currently released into the air every single day across these sites.',
    },
    {
      key: 'readiness',
      label: 'Deploy readiness',
      value: String(readiness.score),
      sub: readiness.label,
      href: '/dashboard',
      tipTitle: 'Deploy readiness',
      tip: 'How close the full dataset is to being truly deploy-ready: data completeness, freshness and documentation all factor in. We are honest about gaps.',
    },
    {
      key: 'revenue',
      label: 'Model revenue',
      value: fmtUsd(revenue),
      sub: 'annual @ live BTC',
      href: '/pitch',
      tipTitle: 'Modelled revenue',
      tip: 'What the portfolio could earn in a year at the current Bitcoin price. A modelled scenario from real generator + ASIC economics — always labelled as a model, never promised.',
    },
    {
      key: 'co2e',
      label: 'CO₂e avoidable',
      value: formatCompactNumber(stats.impact.co2eAvoided100PctTonnes, 1),
      sub: 't/yr @ 100% capture',
      href: '/education',
      tipTitle: 'Avoidable CO₂e',
      tip: 'Tonnes of CO₂-equivalent that stop entering the atmosphere each year if the methane at these sites is captured. 100% capture is the ceiling, not the promise.',
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
      description: `${stats.siteCount} mapped ECCC sites (${(stats.withReportedCh4 ?? 2588)} with reported CH₄, ${(stats.highConfidenceWithEmission ?? 675)} high-confidence) · avg score ${stats.totals.avgStrandedScore} · deploy readiness ${readiness.score}/100`,
    },
  }
}