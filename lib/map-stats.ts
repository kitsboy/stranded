import type { EnrichedSite } from './sites'

export type ProvinceCount = { province: string; count: number }

export type MapFilterStats = {
  count: number
  avgScore: number
  totalEmissionKgDay: number
  topProvince: string | null
  topProvinceCount: number
  provinces: ProvinceCount[]
}

/** Aggregate live stats for the currently filtered site set. */
export function computeMapFilterStats(sites: EnrichedSite[]): MapFilterStats {
  if (!sites.length) {
    return {
      count: 0,
      avgScore: 0,
      totalEmissionKgDay: 0,
      topProvince: null,
      topProvinceCount: 0,
      provinces: [],
    }
  }

  let totalScore = 0
  let totalEmission = 0
  const byProvince = new Map<string, number>()

  for (const s of sites) {
    totalScore += s.strandedScore
    totalEmission += s.emission
    const prov = s.properties.province || 'Unknown'
    byProvince.set(prov, (byProvince.get(prov) || 0) + 1)
  }

  const provinces = Array.from(byProvince.entries())
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count)

  const top = provinces[0]

  return {
    count: sites.length,
    avgScore: Math.round((totalScore / sites.length) * 10) / 10,
    totalEmissionKgDay: Math.round(totalEmission),
    topProvince: top?.province ?? null,
    topProvinceCount: top?.count ?? 0,
    provinces,
  }
}

export type DensityTier = 'sparse' | 'moderate' | 'dense' | 'full'

/** Relative density tier from visible vs total site count. */
export function siteDensityTier(visible: number, total: number): DensityTier {
  if (total <= 0 || visible <= 0) return 'sparse'
  const ratio = visible / total
  if (ratio >= 0.95) return 'full'
  if (ratio >= 0.5) return 'dense'
  if (ratio >= 0.15) return 'moderate'
  return 'sparse'
}

export type FilterSnapshot = {
  minScore: number
  minEmission: number
  maxEmission: number
  provinceCount: number
  sourceCount: number
  hasRadius: boolean
  gridLayer: boolean
  internetLayer: boolean
}

/** Build an aria-live announcement summarizing active filters. */
export function buildFilterAnnouncement(
  shown: number,
  total: number,
  filters: FilterSnapshot,
  strings: {
    base: string
    score: (score: number) => string
    emission: (min: number, max: number) => string
    provinces: (count: number) => string
    sources: (count: number) => string
    radius: string
    grid: string
    internet: string
  },
): string {
  const parts = [strings.base.replace('{shown}', String(shown)).replace('{total}', String(total))]

  if (filters.minScore > 0) parts.push(strings.score(filters.minScore))
  if (filters.minEmission > 0 || filters.maxEmission < 100_000) {
    parts.push(strings.emission(filters.minEmission, filters.maxEmission))
  }
  if (filters.provinceCount > 0) parts.push(strings.provinces(filters.provinceCount))
  if (filters.sourceCount > 0) parts.push(strings.sources(filters.sourceCount))
  if (filters.hasRadius) parts.push(strings.radius)
  if (filters.gridLayer) parts.push(strings.grid)
  if (filters.internetLayer) parts.push(strings.internet)

  return parts.join('. ')
}