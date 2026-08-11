/** Confidence band around a stranded score (measured vs inferred inputs). */

export type ConfidenceBand = {
  band: 'high' | 'medium' | 'low'
  low: number
  high: number
  reason: string
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n))
}

export type ScoreConfidenceProps = {
  score?: number
  confidence?: string | null
  distance_to_grid_km?: number | null
  dataQualityScore?: number | null
  measuredGrid?: boolean
  [key: string]: unknown
}

/**
 * Estimate a high/medium/low confidence band around a score.
 *
 * Overloads:
 *   scoreConfidenceBand({ score, confidence, distance_to_grid_km, dataQualityScore })
 *   scoreConfidenceBand(score, props, dataQualityScore?)
 */
export function scoreConfidenceBand(
  scoreOrInput: number | ScoreConfidenceProps,
  props: Record<string, unknown> = {},
  dataQualityScore?: number,
): ConfidenceBand {
  let score: number
  let p: Record<string, unknown>
  let dq: number | undefined

  if (typeof scoreOrInput === 'object' && scoreOrInput != null) {
    score = Number(scoreOrInput.score) || 0
    p = scoreOrInput
    dq =
      scoreOrInput.dataQualityScore != null
        ? Number(scoreOrInput.dataQualityScore)
        : undefined
  } else {
    score = Number(scoreOrInput) || 0
    p = props ?? {}
    dq = dataQualityScore
  }

  let halfWidth = 6
  const reasons: string[] = []

  const hasMeasured =
    p.measuredGrid === true
    || (p.distance_to_grid_km != null && Number.isFinite(Number(p.distance_to_grid_km)))

  if (!hasMeasured) {
    halfWidth += 4
    reasons.push('grid distance inferred')
  } else {
    reasons.push('measured grid distance')
  }

  const conf = String(p.confidence || '').toLowerCase()
  if (conf === 'high') {
    halfWidth -= 2
    reasons.push('high ECCC confidence')
  } else if (conf === 'low') {
    halfWidth += 5
    reasons.push('low ECCC confidence')
  } else if (!conf) {
    halfWidth += 3
    reasons.push('confidence unknown')
  }

  if (dq != null && Number.isFinite(dq)) {
    if (dq < 60) {
      halfWidth += 5
      reasons.push('data quality weak')
    } else if (dq >= 85) {
      halfWidth -= 2
      reasons.push('data quality strong')
    }
  }

  halfWidth = Math.max(3, Math.min(18, halfWidth))
  const low = clamp(Math.round(score - halfWidth))
  const high = clamp(Math.round(score + halfWidth))

  let band: ConfidenceBand['band'] = 'medium'
  if (halfWidth <= 6 && conf === 'high') band = 'high'
  else if (halfWidth >= 12 || conf === 'low') band = 'low'

  return {
    band,
    low,
    high,
    reason: reasons.join(' · ') || 'default band',
  }
}
