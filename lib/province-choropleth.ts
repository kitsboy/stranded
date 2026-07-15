/** Simplified province bounding boxes for emission choropleth overlay (WGS84). */
export type ProvinceBox = { name: string; minLng: number; maxLng: number; minLat: number; maxLat: number }

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

export function emissionChoroplethGeojson(
  totals: Record<string, number>,
): GeoJSON.FeatureCollection {
  const max = Math.max(...Object.values(totals), 1)
  const features: GeoJSON.Feature[] = PROVINCE_BOXES.map(box => {
    const emission = totals[box.name] || 0
    const intensity = emission / max
    return {
      type: 'Feature',
      properties: { name: box.name, emission, intensity },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [box.minLng, box.minLat],
          [box.maxLng, box.minLat],
          [box.maxLng, box.maxLat],
          [box.minLng, box.maxLat],
          [box.minLng, box.minLat],
        ]],
      },
    }
  })
  return { type: 'FeatureCollection', features }
}

export function emissionFillColor(intensity: number): string {
  const t = Math.min(1, Math.max(0, intensity))
  const r = Math.round(20 + t * 235)
  const g = Math.round(184 - t * 120)
  const b = Math.round(166 - t * 100)
  const a = 0.15 + t * 0.45
  return `rgba(${r},${g},${b},${a})`
}