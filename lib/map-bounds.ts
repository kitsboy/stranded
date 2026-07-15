export type MapBounds = {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

type CoordSite = { geometry: { coordinates: [number, number] } }

/** Bounding box for a set of point sites (WGS84). */
export function boundsFromSites(sites: CoordSite[]): MapBounds | null {
  if (!sites.length) return null

  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  for (const s of sites) {
    const [lng, lat] = s.geometry.coordinates
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }

  return { minLng, minLat, maxLng, maxLat }
}

/** Approximate bounding-box area in km² (mid-latitude correction). */
export function boundsAreaKm2(bounds: MapBounds): number {
  const latMid = (bounds.minLat + bounds.maxLat) / 2
  const latKm = Math.abs(bounds.maxLat - bounds.minLat) * 111.32
  const lngKm =
    Math.abs(bounds.maxLng - bounds.minLng) * 111.32 * Math.cos((latMid * Math.PI) / 180)
  return Math.max(latKm * lngKm, 1)
}

/** Sites per 1,000 km² within the given bounds. */
export function sitesPer1000Km2(count: number, bounds: MapBounds | null): number | null {
  if (!bounds || count <= 0) return null
  const area = boundsAreaKm2(bounds)
  return Math.round((count / area) * 1000 * 10) / 10
}

/** Pad bounds by a fraction of span (default 5%). */
export function expandBounds(bounds: MapBounds, pad = 0.05): MapBounds {
  const dLng = (bounds.maxLng - bounds.minLng) * pad
  const dLat = (bounds.maxLat - bounds.minLat) * pad
  return {
    minLng: bounds.minLng - dLng,
    minLat: bounds.minLat - dLat,
    maxLng: bounds.maxLng + dLng,
    maxLat: bounds.maxLat + dLat,
  }
}

/** Center of bounds as [lng, lat]. */
export function boundsCenter(bounds: MapBounds): [number, number] {
  return [(bounds.minLng + bounds.maxLng) / 2, (bounds.minLat + bounds.maxLat) / 2]
}

/** Alias for expandBounds with a larger default pad (upgrade 318). */
export function padBounds(bounds: MapBounds, fraction = 0.12): MapBounds {
  return expandBounds(bounds, fraction)
}

/** MapLibre fitBounds tuple: [[west, south], [east, north]] */
export function boundsToFitTuple(bounds: MapBounds): [[number, number], [number, number]] {
  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ]
}

/** True when bounds span is valid and non-degenerate. */
export function isValidBounds(bounds: MapBounds | null): bounds is MapBounds {
  if (!bounds) return false
  return (
    Number.isFinite(bounds.minLng) &&
    Number.isFinite(bounds.maxLng) &&
    Number.isFinite(bounds.minLat) &&
    Number.isFinite(bounds.maxLat) &&
    bounds.maxLng >= bounds.minLng &&
    bounds.maxLat >= bounds.minLat
  )
}