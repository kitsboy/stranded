/** Score percentile helpers — ranking badges for site panels & map */

export function scorePercentile(score: number, allScores: number[]): number {
  if (!allScores.length) return 50
  const sorted = [...allScores].sort((a, b) => a - b)
  const below = sorted.filter(s => s < score).length
  return Math.round((below / sorted.length) * 100)
}

/** Percentile rank badge: top 1% / top 5% / top 10% */
export function scoreBadgeLabel(percentile: number): string {
  if (percentile >= 99) return 'Top 1%'
  if (percentile >= 95) return 'Top 5%'
  if (percentile >= 90) return 'Top 10%'
  if (percentile >= 75) return 'Top 25%'
  if (percentile >= 50) return 'Top 50%'
  return ''
}

export function scoreBadgeTier(percentile: number): 'elite' | 'high' | 'medium' | 'none' {
  if (percentile >= 99) return 'elite'
  if (percentile >= 90) return 'high'
  if (percentile >= 75) return 'medium'
  return 'none'
}