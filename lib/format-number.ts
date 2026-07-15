/** Compact K/M/B style number for map HUD stats (e.g. 1.2M, 450K). */
export function formatCompactNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(decimals)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`
  return value.toLocaleString()
}