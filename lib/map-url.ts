export type MapUrlState = {
  site?: string
  mission?: string
  minScore?: number
  minEmission?: number
  provinces?: string[]
}

export function parseMapUrl(params: URLSearchParams): MapUrlState {
  const state: MapUrlState = {}
  const site = params.get('site')
  const mission = params.get('mission')
  const minScore = params.get('minScore')
  const minEmission = params.get('minEmission')
  const provinces = params.get('provinces')
  if (site) state.site = site
  if (mission) state.mission = mission
  if (minScore) state.minScore = +minScore
  if (minEmission) state.minEmission = +minEmission
  if (provinces) state.provinces = provinces.split(',').filter(Boolean)
  return state
}

export function buildMapUrl(state: MapUrlState): string {
  const p = new URLSearchParams()
  if (state.site) p.set('site', state.site)
  if (state.mission) p.set('mission', state.mission)
  if (state.minScore != null) p.set('minScore', String(state.minScore))
  if (state.minEmission != null) p.set('minEmission', String(state.minEmission))
  if (state.provinces?.length) p.set('provinces', state.provinces.join(','))
  const q = p.toString()
  return q ? `/map?${q}` : '/map'
}