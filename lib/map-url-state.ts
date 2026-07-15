export type MapUrlState = {
  site?: string
  mission?: string
  minScore?: number
  minEmission?: number
  provinces?: string[]
  province?: string
  /** Radius filter center + km (optional circle overlay) */
  radius?: number
  lat?: number
  lng?: number
}

export function parseMapUrl(params: URLSearchParams): MapUrlState {
  const state: MapUrlState = {}
  const site = params.get('site')
  const mission = params.get('mission')
  const minScore = params.get('minScore')
  const minEmission = params.get('minEmission')
  const provinces = params.get('provinces')
  const province = params.get('province')
  const radius = params.get('radius')
  const lat = params.get('lat')
  const lng = params.get('lng')

  if (site) state.site = site
  if (mission) state.mission = mission
  if (minScore) state.minScore = +minScore
  if (minEmission) state.minEmission = +minEmission
  const list = [
    ...(provinces ? provinces.split(',').filter(Boolean) : []),
    ...(province ? [province] : []),
  ]
  if (list.length) state.provinces = Array.from(new Set(list))
  if (province) state.province = province
  if (radius) {
    const r = +radius
    if (r > 0) state.radius = r
  }
  if (lat) state.lat = +lat
  if (lng) state.lng = +lng
  return state
}

export function buildMapUrl(state: MapUrlState): string {
  const p = new URLSearchParams()
  if (state.site) p.set('site', state.site)
  if (state.mission) p.set('mission', state.mission)
  if (state.minScore != null) p.set('minScore', String(state.minScore))
  if (state.minEmission != null) p.set('minEmission', String(state.minEmission))
  if (state.provinces?.length) p.set('provinces', state.provinces.join(','))
  else if (state.province) p.set('province', state.province)
  if (state.radius != null && state.lat != null && state.lng != null) {
    p.set('radius', String(state.radius))
    p.set('lat', String(state.lat))
    p.set('lng', String(state.lng))
  }
  const q = p.toString()
  return q ? `/map?${q}` : '/map'
}

/** Haversine distance in km between two WGS84 points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}