import { StrandedSite } from '@/types/site'
import { computeStrandedScore as computeScore } from './scoring-shared.cjs'

/** Stranded Score™ v3 — see lib/scoring-shared.cjs for canonical formula */
export function computeStrandedScore(site: StrandedSite): number {
  return computeScore(site.properties)
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