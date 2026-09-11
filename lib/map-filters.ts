/** Map filter helpers — active count, chips, preset matching (#301–315, #388–389) */

const TOAST_DEDUPE_MS = 3200
const recentFilterToasts = new Map<string, number>()

/** Returns true when a toast with this key may be shown (dedupes rapid repeats). */
export function shouldShowFilterToast(key: string, windowMs = TOAST_DEDUPE_MS): boolean {
  const now = Date.now()
  const last = recentFilterToasts.get(key) ?? 0
  if (now - last < windowMs) return false
  recentFilterToasts.set(key, now)
  return true
}

/** Non-empty preset name validation (#388). */
export function validatePresetName(name: string): { ok: true; trimmed: string } | { ok: false } {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false }
  return { ok: true, trimmed }
}

export const DEFAULT_MIN_EMISSION = 0
export const DEFAULT_MAX_EMISSION = 100_000
export const SLIDER_MAX_EMISSION = 65_000
export const EMISSION_LOG_FLOOR = 10

export const SCORE_PRESETS = [
  { label: 'All', v: 0 },
  { label: 'Med+', v: 45 },
  { label: 'High+', v: 65 },
  { label: 'Elite', v: 85 },
] as const

export type EmissionPresetId = 'low' | 'med' | 'high' | 'all'

export const EMISSION_PRESETS: { id: EmissionPresetId; min: number; max: number }[] = [
  { id: 'low', min: 0, max: 500 },
  { id: 'med', min: 500, max: 5000 },
  { id: 'high', min: 5000, max: SLIDER_MAX_EMISSION },
  { id: 'all', min: DEFAULT_MIN_EMISSION, max: DEFAULT_MAX_EMISSION },
]

export const MAP_FILTERS_COLLAPSED_KEY = 'stranded-map-filters-collapsed'
export type MapFilterChip = {
  id: string
  label: string
  onRemove: () => void
}

/** Data-recency filter — how old the site's freshest GHGRP filing is. */
export type RecencyFilter = 'any' | '2024' | '2023' | 'older'

/** Flux-status filter — does the site already burn its methane, or just vent it? */
export type FluxFilter = 'any' | 'flaring' | 'venting'

export type MapFilterState = {
  minEmission: number
  maxEmission: number
  selectedProvinces: Set<string>
  selectedSources: Set<string>
  minScore: number
  onlyMissionSites: boolean
  gridLayer: boolean
  internetLayer: boolean
  radiusFilter: { lat: number; lng: number; radiusKm: number } | null
  recency: RecencyFilter
  flux: FluxFilter
}

/* ------------------------------------------------------------------ */
/* Data recency + flux status (ECCC GHGRP)                             */
/* ------------------------------------------------------------------ */

/** Accepts a properties bag from any site shape (typed or not). */
function asProps(props: unknown): Record<string, unknown> | null {
  return props && typeof props === 'object' ? (props as Record<string, unknown>) : null
}

/** The year the site's figures actually come from; null when the dataset omits it. */
export function siteRecencyYear(props: unknown): number | null {
  const p = asProps(props)
  if (!p) return null
  const y = Number(p.last_reported_year ?? p.reference_year)
  return Number.isFinite(y) && y > 1990 ? y : null
}

export function matchesRecency(props: unknown, filter: RecencyFilter): boolean {
  if (filter === 'any') return true
  const year = siteRecencyYear(props)
  if (year == null) return false
  if (filter === '2024') return year >= 2024
  if (filter === '2023') return year === 2023
  return year < 2023
}

/**
 * True when the facility reports CH₄ sent to flare (alone or alongside venting).
 * Never true when ECCC publishes no venting/flaring split for the facility —
 * "not reported" must not be rendered as "does not flare".
 */
export function isFlaringSite(props: unknown): boolean {
  const p = asProps(props)
  if (!p) return false
  if (p.flux_scope === 'not-applicable') return false
  if (p.flux_status === 'flaring' || p.flux_status === 'both') return true
  return Number(p.ch4_flared_kg_day) > 0
}

/** True when the facility reports vented CH₄ (alone or alongside flaring). */
export function isVentingSite(props: unknown): boolean {
  const p = asProps(props)
  if (!p) return false
  if (p.flux_scope === 'not-applicable') return false
  if (p.flux_status === 'venting' || p.flux_status === 'both') return true
  return Number(p.ch4_vented_kg_day) > 0
}

/** True when ECCC publishes no venting/flaring split for this facility's source type. */
export function fluxNotReported(props: unknown): boolean {
  const p = asProps(props)
  if (!p) return true
  if (p.flux_scope === 'not-applicable') return true
  return p.flux_status === 'not_reported' || p.flux_status === 'unknown' || p.flux_status == null
}

export function matchesFlux(props: unknown, filter: FluxFilter): boolean {
  if (filter === 'any') return true
  if (filter === 'flaring') return isFlaringSite(props)
  return isVentingSite(props)
}

export const RECENCY_FILTERS: { id: RecencyFilter; label: string; hint: string }[] = [
  { id: 'any', label: 'Any year', hint: 'Every site, whatever year it last filed' },
  { id: '2024', label: '2024', hint: 'Freshest GHGRP year published' },
  { id: '2023', label: '2023', hint: 'Last reported in 2023' },
  { id: 'older', label: '2022 or older', hint: 'Last filed before 2023 — may be closed or re-permitted' },
]

export const FLUX_FILTERS: { id: FluxFilter; label: string; hint: string }[] = [
  { id: 'any', label: 'Any', hint: 'No filter on venting vs flaring' },
  { id: 'flaring', label: 'Already flaring', hint: 'Reports CH₄ sent to flare — permits and equipment already in place' },
  { id: 'venting', label: 'Venting', hint: 'Reports vented CH₄' },
]

/** Counts by recency bucket — used to expose the split on /sites and /provinces. */
export function recencyBreakdown(
  sites: { properties: unknown }[],
): { y2024: number; y2023: number; older: number; unknown: number; newestYear: number | null } {
  let y2024 = 0
  let y2023 = 0
  let older = 0
  let unknown = 0
  let newestYear = 0
  for (const s of sites) {
    const y = siteRecencyYear(s.properties)
    if (y == null) { unknown++; continue }
    if (y > newestYear) newestYear = y
    if (y >= 2024) y2024++
    else if (y === 2023) y2023++
    else older++
  }
  return { y2024, y2023, older, unknown, newestYear: newestYear || null }
}

/**
 * Counts by flux status. `covered` is how many sites actually have a published
 * venting/flaring split — the honest denominator for any "already flaring" claim.
 */
export function fluxBreakdown(
  sites: { properties: unknown }[],
): { flaring: number; ventingOnly: number; both: number; noneReported: number; uncovered: number; covered: number } {
  let flaring = 0
  let ventingOnly = 0
  let both = 0
  let noneReported = 0
  let uncovered = 0
  for (const s of sites) {
    const p = asProps(s.properties)
    const st = p?.flux_status
    if (fluxNotReported(p)) { uncovered++; continue }
    if (st === 'both') { both++; flaring++ }
    else if (st === 'flaring') flaring++
    else if (st === 'venting') ventingOnly++
    else noneReported++
  }
  return { flaring, ventingOnly, both, noneReported, uncovered, covered: sites.length - uncovered }
}

export function isDefaultEmissionRange(min: number, max: number): boolean {
  return min <= DEFAULT_MIN_EMISSION && max >= DEFAULT_MAX_EMISSION
}

export function matchEmissionPreset(min: number, max: number): EmissionPresetId | null {
  const hit = EMISSION_PRESETS.find(p => p.min === min && p.max === max)
  return hit?.id ?? null
}

export function matchScorePresetLabel(minScore: number): string | null {
  const hit = SCORE_PRESETS.find(p => p.v === minScore)
  return hit?.label ?? null
}

export function countActiveMapFilters(state: MapFilterState): number {
  let n = 0
  if (!isDefaultEmissionRange(state.minEmission, state.maxEmission)) n++
  if (state.selectedProvinces.size > 0) n++
  if (state.selectedSources.size > 0) n++
  if (state.minScore > 0) n++
  if (state.onlyMissionSites) n++
  if (state.gridLayer) n++
  if (state.internetLayer) n++
  if (state.radiusFilter) n++
  if (state.recency && state.recency !== 'any') n++
  if (state.flux && state.flux !== 'any') n++
  return n
}

export function emissionLogToLinear(pos: number, max = SLIDER_MAX_EMISSION): number {
  if (pos <= 0) return DEFAULT_MIN_EMISSION
  const t = Math.max(0, Math.min(1, pos / 1000))
  const raw = Math.pow(
    10,
    Math.log10(EMISSION_LOG_FLOOR) + t * (Math.log10(max) - Math.log10(EMISSION_LOG_FLOOR)),
  )
  return Math.round(raw)
}

export function emissionLinearToLog(value: number, max = SLIDER_MAX_EMISSION): number {
  if (value <= DEFAULT_MIN_EMISSION) return 0
  const clamped = Math.max(EMISSION_LOG_FLOOR, Math.min(max, value))
  const t =
    (Math.log10(clamped) - Math.log10(EMISSION_LOG_FLOOR)) /
    (Math.log10(max) - Math.log10(EMISSION_LOG_FLOOR))
  return Math.round(t * 1000)
}

type ChipLabels = {
  emission: string
  score: string
  provinces: string
  sources: string
  missionOnly: string
  grid: string
  internet: string
  radius: string
  recency: string
  flux: string
}

export function buildMapFilterChips(
  state: MapFilterState,
  labels: ChipLabels,
  handlers: {
    resetEmission: () => void
    clearScore: () => void
    clearProvinces: () => void
    clearSources: () => void
    clearMissionOnly: () => void
    clearGrid: () => void
    clearInternet: () => void
    clearRadius: () => void
    clearRecency: () => void
    clearFlux: () => void
  },
): MapFilterChip[] {
  const chips: MapFilterChip[] = []

  if (!isDefaultEmissionRange(state.minEmission, state.maxEmission)) {
    chips.push({
      id: 'emission',
      label: `${labels.emission}: ${state.minEmission.toLocaleString()}–${state.maxEmission.toLocaleString()}`,
      onRemove: handlers.resetEmission,
    })
  }
  if (state.minScore > 0) {
    chips.push({
      id: 'score',
      label: `${labels.score} ≥ ${state.minScore}`,
      onRemove: handlers.clearScore,
    })
  }
  if (state.selectedProvinces.size > 0) {
    const list = Array.from(state.selectedProvinces).slice(0, 3).join(', ')
    const extra = state.selectedProvinces.size > 3 ? ` +${state.selectedProvinces.size - 3}` : ''
    chips.push({
      id: 'provinces',
      label: `${labels.provinces}: ${list}${extra}`,
      onRemove: handlers.clearProvinces,
    })
  }
  if (state.selectedSources.size > 0) {
    const list = Array.from(state.selectedSources).slice(0, 2).join(', ')
    const extra = state.selectedSources.size > 2 ? ` +${state.selectedSources.size - 2}` : ''
    chips.push({
      id: 'sources',
      label: `${labels.sources}: ${list}${extra}`,
      onRemove: handlers.clearSources,
    })
  }
  if (state.onlyMissionSites) {
    chips.push({ id: 'mission', label: labels.missionOnly, onRemove: handlers.clearMissionOnly })
  }
  if (state.gridLayer) {
    chips.push({ id: 'grid', label: labels.grid, onRemove: handlers.clearGrid })
  }
  if (state.internetLayer) {
    chips.push({ id: 'internet', label: labels.internet, onRemove: handlers.clearInternet })
  }
  if (state.radiusFilter) {
    chips.push({
      id: 'radius',
      label: `${labels.radius} ${state.radiusFilter.radiusKm} km`,
      onRemove: handlers.clearRadius,
    })
  }
  if (state.recency && state.recency !== 'any') {
    const label = RECENCY_FILTERS.find(f => f.id === state.recency)?.label ?? state.recency
    chips.push({ id: 'recency', label: `${labels.recency}: ${label}`, onRemove: handlers.clearRecency })
  }
  if (state.flux && state.flux !== 'any') {
    const label = FLUX_FILTERS.find(f => f.id === state.flux)?.label ?? state.flux
    chips.push({ id: 'flux', label: `${labels.flux}: ${label}`, onRemove: handlers.clearFlux })
  }

  return chips
}
