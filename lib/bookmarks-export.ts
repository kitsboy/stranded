import type { EnrichedSite } from './sites'

function esc(s: string) {
  return `"${String(s ?? '').replace(/"/g, '""')}"`
}

export type BookmarkExportSite = EnrichedSite & { tag?: string }

/** CSV export for bookmarked sites (watchlist diligence fields). */
export function exportBookmarksCsv(sites: BookmarkExportSite[]): string {
  const headers = [
    'id',
    'name',
    'province',
    'tag',
    'emission_kg_day',
    'stranded_score',
    'recommended_genset',
    'potential_daily_cad',
    'source_type',
    'confidence',
  ]
  const rows = sites.map(s => {
    const p = s.properties
    return [
      s.id,
      esc(p.name || ''),
      esc(p.province || ''),
      esc(s.tag || ''),
      s.emission,
      s.strandedScore,
      esc(s.recommendedGenset || ''),
      s.potentialDailyProfitCAD,
      esc(p.source_type || ''),
      esc(p.confidence || ''),
    ].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}