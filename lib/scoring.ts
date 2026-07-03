import { StrandedSite } from '@/types/site'

const INTERNET_FACTOR: Record<string, number> = {
  fiber: 1.35, starlink: 1.15, lte: 1.0, cable: 1.05, none: 0.7,
}

const CONFIDENCE_FACTOR: Record<string, number> = {
  high: 1.25, medium: 1.0, low: 0.75,
}

/** Retuned v2: log-scale emission drives score; meaningful spread across 2,611 sites */
export function computeStrandedScore(site: StrandedSite): number {
  const p = site.properties
  const emission = p.emission_rate_kg_day || 0
  const dist = p.distance_to_grid_km ?? 50
  const internet = (p.internet_type || 'none').toLowerCase()
  const conf = (p.confidence || 'medium').toLowerCase()

  const emissionScore = (Math.log10(Math.max(emission, 10)) / Math.log10(60000)) * 52
  const proximityScore = Math.min(22, Math.max(4, 24 - dist * 0.25))
  const infraScore = (INTERNET_FACTOR[internet] || 0.85) * 9
  const confScore = (CONFIDENCE_FACTOR[conf] || 1) * 7

  const raw = emissionScore + proximityScore + infraScore + confScore
  return Math.max(18, Math.min(99.5, Math.round(raw * 10) / 10))
}

export function scorePercentile(score: number, allScores: number[]): number {
  if (!allScores.length) return 50
  const sorted = [...allScores].sort((a, b) => a - b)
  const below = sorted.filter(s => s < score).length
  return Math.round((below / sorted.length) * 100)
}

export function scoreTier(score: number): 'elite' | 'high' | 'medium' | 'low' {
  if (score >= 85) return 'elite'
  if (score >= 65) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

export function scoreBadgeLabel(percentile: number): string {
  if (percentile >= 95) return 'Top 5%'
  if (percentile >= 90) return 'Top 10%'
  if (percentile >= 75) return 'Top 25%'
  if (percentile >= 50) return 'Top 50%'
  return ''
}