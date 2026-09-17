/** Score percentile helpers — ranking badges for site panels & map */

/**
 * One score's percentile against an array of scores.
 *
 * Sorts and scans the whole array on every call. Calling this in a loop over the whole
 * dataset is O(n² log n) — use `scorePercentiles()` for that; this stays for the one-off
 * call sites (a dashboard chart, a single-site badge).
 */
export function scorePercentile(score: number, allScores: number[]): number {
  if (!allScores.length) return 50
  const sorted = [...allScores].sort((a, b) => a - b)
  const below = sorted.filter(s => s < score).length
  return Math.round((below / sorted.length) * 100)
}

/**
 * Every score's percentile against the same array, in one pass: sort once, binary-search
 * each score → O(n log n) instead of O(n² log n), with identical values.
 *
 * Why it exists: ranking all 2,611 map sites with `scorePercentile()` (two calls per site)
 * cost ~7 s of CPU — about 25 s on a throttled phone, as long tasks that blocked the main
 * thread. That is what made a shared link take 10–37 s to show its own site, and what kept
 * a deep-link card from rendering even after that site's record had already arrived.
 */
export function scorePercentiles(allScores: number[]): number[] {
  if (!allScores.length) return []
  const sorted = [...allScores].sort((a, b) => a - b)
  return allScores.map((score) => {
    // first index whose value is >= score == the count of scores strictly below it
    let lo = 0
    let hi = sorted.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (sorted[mid] < score) lo = mid + 1
      else hi = mid
    }
    return Math.round((lo / sorted.length) * 100)
  })
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