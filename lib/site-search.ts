import type { EnrichedSite } from './sites'
import { effectiveGridKm } from './sites'
import { fuzzyScore } from './fuzzy-search'

export type SiteSearchPreset = {
  label: string
  filter: (s: EnrichedSite) => boolean
}

export type SiteSearchMatch = {
  site: EnrichedSite
  matchType: 'name' | 'province' | 'company' | 'id' | 'ghgrp' | 'naics' | 'fuzzy'
  score: number
}

export const SITE_SEARCH_PRESETS: SiteSearchPreset[] = [
  { label: 'Elite Score (≥85)', filter: s => s.strandedScore >= 85 },
  { label: 'High Score (≥65)', filter: s => s.strandedScore >= 65 },
  { label: 'Top Emitters', filter: s => s.emission > 5000 },
  { label: 'Near Grid (<10km)', filter: s => effectiveGridKm(s) < 10 },
]

function detectMatchType(site: EnrichedSite, q: string): SiteSearchMatch['matchType'] {
  const p = site.properties
  const lower = q.toLowerCase()
  if (String(p.ghgrp_id ?? '').toLowerCase().includes(lower)) return 'ghgrp'
  if (String(p.naics_code ?? '').toLowerCase().includes(lower)) return 'naics'
  if (String(site.id).toLowerCase().includes(lower)) return 'id'
  if ((p.province || '').toLowerCase().includes(lower)) return 'province'
  if ((p.company || '').toLowerCase().includes(lower)) return 'company'
  if ((p.name || '').toLowerCase().includes(lower)) return 'name'
  return 'fuzzy'
}

/** Fuzzy search enriched sites (includes + startsWith scoring). */
export function searchSites(
  sites: EnrichedSite[],
  query: string,
  limit = 14,
): SiteSearchMatch[] {
  const q = query.trim()
  if (!q) return sites.slice(0, 12).map(site => ({ site, matchType: 'name' as const, score: 0 }))
  return sites
    .map(site => {
      const p = site.properties
      const score = fuzzyScore(
        q,
        p.name,
        p.province,
        p.company,
        p.city,
        String(site.id),
        String(p.ghgrp_id ?? ''),
        String(p.naics_code ?? ''),
      )
      return { site, matchType: detectMatchType(site, q), score }
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || b.site.strandedScore - a.site.strandedScore)
    .slice(0, limit)
}

/** Simple ranked list (no match metadata) — for tests and helpers. */
export function searchSitesSimple(
  sites: EnrichedSite[],
  query: string,
  limit = 14,
): EnrichedSite[] {
  return searchSites(sites, query, limit).map(m => m.site)
}