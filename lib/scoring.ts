import { StrandedSite } from '@/types/site'
import {
  computeStrandedScore as computeScore,
  explainStrandedScore as explainScore,
  resolveGridDistanceKm as resolveGridKm,
  resolveInternetFactor as resolveNet,
} from './scoring-shared.cjs'

type PropsLike = { properties?: Record<string, unknown> } | Record<string, unknown>

function propsOf(siteOrProps: PropsLike): Record<string, unknown> {
  if (siteOrProps && typeof siteOrProps === 'object' && 'properties' in siteOrProps && siteOrProps.properties) {
    return siteOrProps.properties as Record<string, unknown>
  }
  return siteOrProps as Record<string, unknown>
}

/** Same grid distance Score v3 uses (measured or inferred). */
export function effectiveGridKm(siteOrProps: PropsLike): number {
  return resolveGridKm(propsOf(siteOrProps)) as number
}

/** Same internet factor Score v3 uses (measured or inferred). */
export function effectiveInternetFactor(siteOrProps: PropsLike): number {
  return resolveNet(propsOf(siteOrProps)) as number
}

export function hasMeasuredGrid(siteOrProps: PropsLike): boolean {
  return propsOf(siteOrProps).distance_to_grid_km != null
}

/** True when connectivity is fiber-class or inferred high-quality (factor ≥ 1.15). */
export function hasStrongConnectivity(siteOrProps: PropsLike): boolean {
  const p = propsOf(siteOrProps)
  const raw = (p.internet_type as string | undefined)?.toLowerCase()
  if (raw === 'fiber' || raw === 'starlink') return true
  if (raw) return false
  return (resolveNet(p) as number) >= 1.15
}

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

export { scorePercentile, scoreBadgeLabel, scoreBadgeTier } from './percentile'

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

