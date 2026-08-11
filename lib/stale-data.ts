/** Dataset freshness helpers (ISO timestamps). */

/** Parse ISO string to Date; null if invalid. */
export function parseGeneratedAt(iso: string | null | undefined): Date | null {
  if (!iso || typeof iso !== 'string') return null
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d : null
}

/** Age in whole days (floor). Negative if future; null if unparseable. */
export function ageDays(iso: string | null | undefined, now = Date.now()): number | null {
  const d = parseGeneratedAt(iso)
  if (!d) return null
  const ms = now - d.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

/** True when age exceeds maxDays (default 45). Missing/invalid counts as stale. */
export function isStale(
  iso: string | null | undefined,
  maxDays = 45,
  now = Date.now(),
): boolean {
  const age = ageDays(iso, now)
  if (age == null) return true
  return age > maxDays
}

/** Human label: fresh / aging / stale / unknown. */
export function freshnessLabel(
  iso: string | null | undefined,
  now = Date.now(),
): string {
  const age = ageDays(iso, now)
  if (age == null) return 'unknown'
  if (age < 0) return 'fresh'
  if (age <= 14) return 'fresh'
  if (age <= 45) return 'aging'
  return 'stale'
}
