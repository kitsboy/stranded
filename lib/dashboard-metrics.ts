import type { LiveStats } from '@/types/live-stats'

export type ReadinessFactor = { name: string; value: number; weight: number; label: string }

export type DeploymentReadiness = {
  score: number
  label: string
  factors: ReadinessFactor[]
}

export type ProvinceRevenueLeader = {
  name: string
  sites: number
  pct: number
  revenueUsd: number
  emissionKgDay: number
}

const READINESS_LABELS: { min: number; label: string }[] = [
  { min: 85, label: 'Mission Ready' },
  { min: 70, label: 'Deployable' },
  { min: 55, label: 'Developing' },
  { min: 0, label: 'Early Stage' },
]

export function deploymentReadiness(stats: LiveStats): DeploymentReadiness {
  const highScorePct = (stats.totals.highScoreSites / stats.siteCount) * 100
  const megaLarge = (stats.emissionTiers.mega || 0) + (stats.emissionTiers.large || 0)
  const megaLargePct = (megaLarge / stats.siteCount) * 100
  const highConf = stats.confidenceCounts.high || 0
  const highConfPct = (highConf / stats.siteCount) * 100
  const genGw = stats.totals.totalGeneratorKW / 1_000_000
  const genScore = Math.min(100, genGw * 12)

  const factors: ReadinessFactor[] = [
    { name: 'highScore', value: highScorePct, weight: 0.35, label: 'Sites score ≥80' },
    { name: 'megaLarge', value: megaLargePct, weight: 0.25, label: 'Mega + large emitters' },
    { name: 'confidence', value: highConfPct, weight: 0.2, label: 'High data confidence' },
    { name: 'capacity', value: genScore, weight: 0.2, label: 'Generator capacity index' },
  ]

  const score = Math.round(
    factors.reduce((s, f) => s + f.value * f.weight, 0),
  )
  const label = READINESS_LABELS.find(r => score >= r.min)?.label ?? 'Early Stage'

  return { score, label, factors }
}

export function provinceRevenueLeaders(stats: LiveStats, limit = 6): ProvinceRevenueLeader[] {
  return stats.provinces
    .map(p => ({
      name: p.name,
      sites: p.count,
      pct: p.pct,
      revenueUsd: p.estRevenueUsd ?? Math.round(stats.valueModel.annualRevenueUsd * (p.pct / 100)),
      emissionKgDay: p.emissionKgDay ?? Math.round(stats.totals.emissionKgDay * (p.pct / 100)),
    }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd)
    .slice(0, limit)
}

export function emissionTierItems(stats: LiveStats) {
  const labels: Record<string, string> = {
    mega: 'Mega (≥20k kg/day)',
    large: 'Large (5k–20k)',
    medium: 'Medium (1k–5k)',
    small: 'Small (100–1k)',
    micro: 'Micro (<100)',
  }
  return Object.entries(stats.emissionTiers)
    .map(([k, v]) => ({ key: k, label: labels[k] || k, count: v, pct: +(v / stats.siteCount * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count)
}

export function confidenceBreakdown(stats: LiveStats) {
  const total = stats.siteCount || 1
  return (['high', 'medium', 'low'] as const).map(level => ({
    level,
    count: stats.confidenceCounts[level] || 0,
    pct: +(((stats.confidenceCounts[level] || 0) / total) * 100).toFixed(1),
  }))
}

export function liveModelRevenue(stats: LiveStats, btcUsd: number) {
  const ratio = stats.valueModel.defaultBtcUsd > 0
    ? btcUsd / stats.valueModel.defaultBtcUsd
    : 1
  return Math.round(stats.valueModel.annualRevenueUsd * ratio)
}

export function captureAtPct(stats: LiveStats, pct: number, btcUsd: number) {
  const share = Math.max(0, Math.min(100, pct)) / 100
  const revenue = liveModelRevenue(stats, btcUsd)
  return {
    sites: Math.round(stats.siteCount * share),
    co2eTonnes: Math.round(stats.impact.co2eAvoided100PctTonnes * share),
    revenueUsd: Math.round(revenue * share),
    btcYr: stats.valueModel.annualBtc * share,
  }
}