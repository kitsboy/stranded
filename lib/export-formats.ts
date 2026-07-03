import { EnrichedSite } from './sites'

export function exportFilteredGeojson(sites: EnrichedSite[]): string {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: sites.map(s => ({
      ...s,
      properties: {
        ...s.properties,
        strandedScore: s.strandedScore,
        emission_kg_day: s.emission,
      },
    })),
  }, null, 2)
}

export function exportSitesKml(sites: EnrichedSite[], name = 'Stranded Mission'): string {
  const placemarks = sites.map(s => {
    const [lng, lat] = s.geometry.coordinates
    const p = s.properties
    return `  <Placemark>
    <name>${escapeXml(p.name || s.id)}</name>
    <description>Score ${s.strandedScore} · ${s.emission} kg/day · ${p.province}</description>
    <Point><coordinates>${lng},${lat},0</coordinates></Point>
  </Placemark>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${escapeXml(name)}</name>
${placemarks}
</Document>
</kml>`
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}