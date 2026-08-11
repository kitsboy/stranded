/** Simple annual gas decline curves for multi-year ROI. */

export type GasDeclineYear = {
  year: number
  emission: number
  /** Factor relative to year-0 daily revenue (1.0 at year 0) */
  revenueFactor: number
}

/**
 * Project emission and revenue factor over `years` calendar steps.
 * Year 0 = base; each subsequent year multiplies by (1 - annualDeclinePct/100).
 */
export function projectGasDecline(
  emissionKgDay: number,
  annualDeclinePct: number,
  years: number,
): GasDeclineYear[] {
  const rate = Math.max(0, annualDeclinePct) / 100
  const base = Math.max(0, Number.isFinite(emissionKgDay) ? emissionKgDay : 0)
  const n = Math.max(0, Math.floor(years))
  const out: GasDeclineYear[] = []
  let em = base
  for (let y = 0; y <= n; y++) {
    const revenueFactor = base > 0 ? em / base : 0
    out.push({
      year: y,
      emission: Math.round(em * 10) / 10,
      revenueFactor: Math.round(revenueFactor * 1000) / 1000,
    })
    em *= 1 - rate
  }
  return out
}

/**
 * Cumulative capture of daily CAD under constant annual decline for `years` full years.
 * Sums baseDailyCad * 365 * revenueFactor for years 0..years-1.
 */
export function cumulativeCapture(
  baseDailyCad: number,
  declinePct: number,
  years: number,
): number {
  const base = Number.isFinite(baseDailyCad) ? Math.max(0, baseDailyCad) : 0
  const n = Math.max(0, Math.floor(years))
  if (n === 0) return 0
  const pts = projectGasDecline(1, declinePct, n - 1)
  return Math.round(
    pts.reduce((sum, p) => sum + base * 365 * p.revenueFactor, 0),
  )
}
