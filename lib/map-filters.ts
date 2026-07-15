/** Map filter helpers — active count, chips, preset matching (#301–315) */

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

  return chips
}