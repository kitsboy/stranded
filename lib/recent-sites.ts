import type { EnrichedSite } from './sites'

const RECENT_KEY = 'stranded-recent-sites-v2'
const MAX_RECENT = 10

export type RecentSiteEntry = {
  id: string
  name: string
  province: string
  score: number
  visitedAt: string
}

export function getRecentSites(): RecentSiteEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

export function recordRecentSite(site: EnrichedSite): void {
  if (typeof window === 'undefined' || !site?.id) return
  const p = site.properties
  const entry: RecentSiteEntry = {
    id: site.id,
    name: p.name || site.id,
    province: p.province || '',
    score: site.strandedScore,
    visitedAt: new Date().toISOString(),
  }
  const next = [entry, ...getRecentSites().filter(r => r.id !== site.id)].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('stranded-recent-updated'))
}

export function clearRecentSites(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECENT_KEY)
}