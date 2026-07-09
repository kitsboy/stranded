const ALERTS_KEY = 'stranded-site-alerts'

export type SiteAlert = { siteId: string; name: string; minScore: number; createdAt: string }

export function getSiteAlerts(): SiteAlert[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]') } catch { return [] }
}

export function addSiteAlert(alert: Omit<SiteAlert, 'createdAt'>) {
  const list = getSiteAlerts().filter(a => a.siteId !== alert.siteId)
  list.push({ ...alert, createdAt: new Date().toISOString() })
  localStorage.setItem(ALERTS_KEY, JSON.stringify(list.slice(-20)))
}

export function removeSiteAlert(siteId: string) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(getSiteAlerts().filter(a => a.siteId !== siteId)))
}

export type WatchHit = SiteAlert & { currentScore: number }

/** Alerts whose minScore is met or exceeded by current site scores (local check on map open). */
export function evaluateWatchHits(
  sites: { id: string; strandedScore: number }[]
): WatchHit[] {
  const byId = new Map(sites.map(s => [s.id, s.strandedScore]))
  return getSiteAlerts()
    .map(a => {
      const currentScore = byId.get(a.siteId)
      if (currentScore == null) return null
      if (currentScore < a.minScore) return null
      return { ...a, currentScore }
    })
    .filter(Boolean) as WatchHit[]
}