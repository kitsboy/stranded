import { EnrichedSite } from './sites'

function esc(s: string) {
  return `"${String(s ?? '').replace(/"/g, '""')}"`
}

/** Full CSV export with all key diligence fields. */
export function exportSitesFullCsv(sites: EnrichedSite[]): string {
  const headers = [
    'id',
    'name',
    'province',
    'emission_kg_day',
    'stranded_score',
    'recommended_genset',
    'ch4_tonnes_year',
    'confidence',
    'source_type',
    'longitude',
    'latitude',
  ]
  const rows = sites.map(s => {
    const p = s.properties
    const [lng, lat] = s.geometry?.coordinates ?? ['', '']
    return [
      s.id,
      esc(p.name || ''),
      esc(p.province || ''),
      s.emission,
      s.strandedScore,
      esc(s.recommendedGenset || ''),
      p.ch4_tonnes_year ?? '',
      esc(p.confidence || ''),
      esc(p.source_type || ''),
      lng,
      lat,
    ].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}