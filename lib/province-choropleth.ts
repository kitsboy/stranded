/**
 * Province boxes are the fallback when `/data/province-boundaries.geojson` fails.
 * The live shades use the 2021 Census cartographic file, generalized by the StatCan service.
 */
export type ProvinceBox = { name: string; minLng: number; maxLng: number; minLat: number; maxLat: number }

export const PROVINCE_BOUNDARY_URL = '/data/province-boundaries.geojson'

export type ProvinceRings = GeoJSON.Polygon | GeoJSON.MultiPolygon

export const PROVINCE_BOXES: ProvinceBox[] = [
  { name: 'Alberta', minLng: -120.5, maxLng: -110, minLat: 49, maxLat: 60 },
  { name: 'British Columbia', minLng: -139.5, maxLng: -114.5, minLat: 48.3, maxLat: 60 },
  { name: 'Saskatchewan', minLng: -110.5, maxLng: -101.5, minLat: 49, maxLat: 60 },
  { name: 'Manitoba', minLng: -102.5, maxLng: -89.5, minLat: 49, maxLat: 60 },
  { name: 'Ontario', minLng: -95.5, maxLng: -74.5, minLat: 41.7, maxLat: 56.5 },
  { name: 'Quebec', minLng: -80, maxLng: -57, minLat: 45, maxLat: 62 },
  { name: 'New Brunswick', minLng: -69, maxLng: -63.5, minLat: 44.5, maxLat: 48.5 },
  { name: 'Nova Scotia', minLng: -66.5, maxLng: -59.5, minLat: 43.5, maxLat: 47 },
  { name: 'Prince Edward Island', minLng: -64.5, maxLng: -62, minLat: 45.9, maxLat: 47.1 },
  { name: 'Newfoundland and Labrador', minLng: -67.5, maxLng: -52, minLat: 46.5, maxLat: 60.5 },
  { name: 'Yukon', minLng: -141.5, maxLng: -123.5, minLat: 60, maxLat: 69.5 },
  { name: 'Northwest Territories', minLng: -136, maxLng: -102, minLat: 60, maxLat: 78.5 },
  { name: 'Nunavut', minLng: -120, maxLng: -61, minLat: 51, maxLat: 83 },
]

function boxGeometry(box: ProvinceBox): GeoJSON.Polygon {
  return {
    type: 'Polygon',
    coordinates: [[
      [box.minLng, box.minLat],
      [box.maxLng, box.minLat],
      [box.maxLng, box.maxLat],
      [box.minLng, box.maxLat],
      [box.minLng, box.minLat],
    ]],
  }
}

/** Keep a polygon only when its name is one of the 13 StatCan keys. */
export function boundariesFromGeojson(
  doc: { features?: Array<{ properties?: { name?: unknown } | null; geometry?: { type?: string; coordinates?: unknown } | null }> } | null | undefined,
): Record<string, ProvinceRings> {
  const allowed = new Set(PROVINCE_BOXES.map((box) => box.name))
  const out: Record<string, ProvinceRings> = {}
  for (const feature of doc?.features || []) {
    const name = String(feature.properties?.name || '')
    const geom = feature.geometry
    if (!allowed.has(name) || !geom) continue
    if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') continue
    if (!Array.isArray(geom.coordinates) || geom.coordinates.length === 0) continue
    out[name] = geom as ProvinceRings
  }
  return out
}

function shapeFor(
  box: ProvinceBox,
  boundaries?: Record<string, ProvinceRings> | null,
): { geometry: ProvinceRings; boundary: 'cartographic' | 'box' } {
  const geom = boundaries?.[box.name]
  if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
    return { geometry: geom, boundary: 'cartographic' }
  }
  return { geometry: boxGeometry(box), boundary: 'box' }
}

function choroplethFeatures(
  totals: Record<string, number>,
  valueKey: 'emission' | 'revenue' | 'value',
  boundaries?: Record<string, ProvinceRings> | null,
): GeoJSON.Feature[] {
  const max = Math.max(...Object.values(totals), 1)
  return PROVINCE_BOXES.map((box) => {
    const amount = totals[box.name] || 0
    const shape = shapeFor(box, boundaries)
    return {
      type: 'Feature',
      properties: {
        name: box.name,
        [valueKey]: amount,
        intensity: amount / max,
        boundary: shape.boundary,
      },
      geometry: shape.geometry,
    }
  })
}

export function emissionChoroplethGeojson(
  totals: Record<string, number>,
  boundaries?: Record<string, ProvinceRings> | null,
): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: choroplethFeatures(totals, 'emission', boundaries) }
}

export function revenueChoroplethGeojson(
  totals: Record<string, number>,
  boundaries?: Record<string, ProvinceRings> | null,
): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: choroplethFeatures(totals, 'revenue', boundaries) }
}

export function emissionFillColor(intensity: number): string {
  const t = Math.min(1, Math.max(0, intensity))
  const r = Math.round(20 + t * 235)
  const g = Math.round(184 - t * 120)
  const b = Math.round(166 - t * 100)
  const a = 0.15 + t * 0.45
  return `rgba(${r},${g},${b},${a})`
}

/**
 * Province choropleth for official Statistics Canada renewable totals.
 * StatCan tables have province-level generation (MWh) and capacity (MW) but no
 * plant coordinates, so this is the honest way to paint them — shade each
 * province by its total, never inventing pin locations.
 */
export function renewableChoroplethGeojson(
  totals: Record<string, number>,
  boundaries?: Record<string, ProvinceRings> | null,
): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: choroplethFeatures(totals, 'value', boundaries) }
}

/** Teal→green ramp for renewable choropleth (distinct from the orange methane ramp). */
export function renewableFillColor(intensity: number): string {
  const t = Math.min(1, Math.max(0, intensity))
  const r = Math.round(16 + t * 40)
  const g = Math.round(185 - t * 40)
  const b = Math.round(190 - t * 30)
  const a = 0.18 + t * 0.5
  return `rgba(${r},${g},${b},${a})`
}