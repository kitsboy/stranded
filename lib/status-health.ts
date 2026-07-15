import type { LiveStats } from '@/types/live-stats'

export type HealthCheckStatus = 'pass' | 'warn' | 'fail'

export type HealthCheck = {
  id: string
  label: string
  status: HealthCheckStatus
  detail: string
}

export type StatusHealthOverall = 'operational' | 'degraded' | 'critical'

export type StatusHealthReport = {
  overall: StatusHealthOverall
  score: number
  checks: HealthCheck[]
}

export const EXPECTED_GEOJSON_FEATURE_COUNT = 2611

export type StatusHealthInput = {
  liveStats?: LiveStats | null
  liveStatsFetchOk?: boolean
  geojsonFeatureCount?: number
  expectedVersion?: string
  statusJsonVersion?: string
}

function checkLiveStatsFetch(ok: boolean | undefined): HealthCheck {
  if (ok === true) {
    return { id: 'live-stats-fetch', label: 'live-stats.json', status: 'pass', detail: 'Fetch succeeded' }
  }
  if (ok === false) {
    return { id: 'live-stats-fetch', label: 'live-stats.json', status: 'fail', detail: 'Fetch failed or timed out' }
  }
  return { id: 'live-stats-fetch', label: 'live-stats.json', status: 'warn', detail: 'Fetch status unknown' }
}

function checkGeojsonSize(count: number | undefined): HealthCheck {
  if (count == null) {
    return { id: 'geojson-size', label: 'GeoJSON dataset', status: 'warn', detail: 'Feature count not verified' }
  }
  if (count === EXPECTED_GEOJSON_FEATURE_COUNT) {
    return {
      id: 'geojson-size',
      label: 'GeoJSON dataset',
      status: 'pass',
      detail: `${count.toLocaleString()} features (canonical)`,
    }
  }
  const delta = count - EXPECTED_GEOJSON_FEATURE_COUNT
  return {
    id: 'geojson-size',
    label: 'GeoJSON dataset',
    status: Math.abs(delta) <= 5 ? 'warn' : 'fail',
    detail: `${count.toLocaleString()} features (expected ${EXPECTED_GEOJSON_FEATURE_COUNT})`,
  }
}

function checkVersionMatch(
  liveStats: LiveStats | null | undefined,
  expectedVersion: string | undefined,
  statusJsonVersion: string | undefined,
): HealthCheck {
  const statsVersion = liveStats?.version
  const versions = [statsVersion, statusJsonVersion, expectedVersion].filter(Boolean) as string[]
  if (!versions.length) {
    return { id: 'version-match', label: 'Version alignment', status: 'warn', detail: 'No version metadata available' }
  }
  const unique = Array.from(new Set(versions))
  if (unique.length === 1) {
    return { id: 'version-match', label: 'Version alignment', status: 'pass', detail: `v${unique[0]} across sources` }
  }
  return {
    id: 'version-match',
    label: 'Version alignment',
    status: 'warn',
    detail: `Mismatch: ${unique.map(v => `v${v}`).join(' vs ')}`,
  }
}

function checkLiveStatsFreshness(liveStats: LiveStats | null | undefined): HealthCheck {
  if (!liveStats?.generatedAt) {
    return { id: 'live-stats-freshness', label: 'Stats freshness', status: 'warn', detail: 'generatedAt missing' }
  }
  const ageMs = Date.now() - new Date(liveStats.generatedAt).getTime()
  const ageHours = ageMs / (1000 * 60 * 60)
  if (ageHours <= 48) {
    return {
      id: 'live-stats-freshness',
      label: 'Stats freshness',
      status: 'pass',
      detail: `Generated ${new Date(liveStats.generatedAt).toLocaleString()}`,
    }
  }
  if (ageHours <= 168) {
    return {
      id: 'live-stats-freshness',
      label: 'Stats freshness',
      status: 'warn',
      detail: `Stats ${Math.round(ageHours)}h old`,
    }
  }
  return {
    id: 'live-stats-freshness',
    label: 'Stats freshness',
    status: 'fail',
    detail: `Stats ${Math.round(ageHours / 24)}d old`,
  }
}

function scoreChecks(checks: HealthCheck[]): number {
  const weights: Record<HealthCheckStatus, number> = { pass: 100, warn: 55, fail: 0 }
  if (!checks.length) return 0
  const total = checks.reduce((sum, c) => sum + weights[c.status], 0)
  return Math.round(total / checks.length)
}

function overallFromChecks(checks: HealthCheck[]): StatusHealthOverall {
  if (checks.some(c => c.status === 'fail')) return 'critical'
  if (checks.some(c => c.status === 'warn')) return 'degraded'
  return 'operational'
}

/** Aggregate platform health from live-stats, GeoJSON, and version signals. */
export function aggregateStatusHealth(input: StatusHealthInput): StatusHealthReport {
  const checks: HealthCheck[] = [
    checkLiveStatsFetch(input.liveStatsFetchOk),
    checkGeojsonSize(input.geojsonFeatureCount),
    checkVersionMatch(input.liveStats, input.expectedVersion, input.statusJsonVersion),
    checkLiveStatsFreshness(input.liveStats),
  ]

  return {
    overall: overallFromChecks(checks),
    score: scoreChecks(checks),
    checks,
  }
}