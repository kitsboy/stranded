import { StrandedSite } from '@/types/site'
import {
  computeStrandedScore as computeScore,
  explainStrandedScore as explainScore,
} from './scoring-shared.cjs'

/** Stranded Score™ v3 — see lib/scoring-shared.cjs for canonical formula */
export function computeStrandedScore(site: StrandedSite): number {
  return computeScore(site.properties)
}

export type ScoreFactor = {
  id: string
  label: string
  points: number
  detail: string
  inferred?: boolean
}

export type ScoreExplanation = {
  score: number
  factors: ScoreFactor[]
  notes: string[]
}

/** Factor breakdown for UI / bank packs — ships the real v3 formula factors */
export function explainStrandedScore(site: StrandedSite | { properties: Record<string, unknown> }): ScoreExplanation {
  const props = 'properties' in site ? site.properties : site
  return explainScore(props) as ScoreExplanation
}

export function scorePercentile(score: number, allScores: number[]): number {
  if (!allScores.length) return 50
  const sorted = [...allScores].sort((a, b) => a - b)
  const below = sorted.filter(s => s < score).length
  return Math.round((below / sorted.length) * 100)
}

/** Stranded Score™ v3 tiers — single source of truth for UI colors */
export function scoreTier(score: number): 'elite' | 'high' | 'medium' | 'low' {
  if (score >= 85) return 'elite'
  if (score >= 65) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

/** CSS class for .stranded-score badges (globals.css) */
export function scoreTierClass(score: number): string {
  const tier = scoreTier(score)
  if (tier === 'elite') return 'score-elite'
  if (tier === 'high') return 'score-high'
  if (tier === 'medium') return 'score-med'
  return 'score-low'
}

/** Map marker / chart hex colors aligned to v3 tiers */
export function scoreTierColor(score: number): string {
  const tier = scoreTier(score)
  if (tier === 'elite') return '#a855f7' // purple — top tier
  if (tier === 'high') return '#22c55e'  // green
  if (tier === 'medium') return '#eab308' // amber
  return '#f97316' // orange
}

export function scoreBadgeLabel(percentile: number): string {
  if (percentile >= 95) return 'Top 5%'
  if (percentile >= 90) return 'Top 10%'
  if (percentile >= 75) return 'Top 25%'
  if (percentile >= 50) return 'Top 50%'
  return ''
}