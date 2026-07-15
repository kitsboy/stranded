const ALERTS_KEY = 'stranded-site-alerts'

export type SiteAlert = {
  siteId: string
  name: string
  minScore: number
  minEmission?: number
  createdAt: string
  lastNotifiedAt?: string
}

export function getSiteAlerts(): SiteAlert[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]') } catch { return [] }
}

export function addSiteAlert(alert: Omit<SiteAlert, 'createdAt' | 'lastNotifiedAt'>) {
  const list = getSiteAlerts().filter(a => a.siteId !== alert.siteId)
  list.push({ ...alert, createdAt: new Date().toISOString() })
  localStorage.setItem(ALERTS_KEY, JSON.stringify(list.slice(-20)))
}

export function markAlertNotified(siteId: string) {
  const list = getSiteAlerts().map(a =>
    a.siteId === siteId ? { ...a, lastNotifiedAt: new Date().toISOString() } : a
  )
  localStorage.setItem(ALERTS_KEY, JSON.stringify(list))
}

export function removeSiteAlert(siteId: string) {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(getSiteAlerts().filter(a => a.siteId !== siteId)))
}

export type WatchHit = SiteAlert & { currentScore: number; currentEmission: number; reasons: string[] }

/** Alerts whose thresholds are met (score and/or emission). */
export function evaluateWatchHits(
  sites: { id: string; strandedScore: number; emission?: number }[],
  options?: { skipRecentlyNotified?: boolean }
): WatchHit[] {
  const byId = new Map(sites.map(s => [s.id, s]))
  const now = Date.now()
  return getSiteAlerts()
    .map(a => {
      const site = byId.get(a.siteId)
      if (!site) return null
      const reasons: string[] = []
      if (site.strandedScore >= a.minScore) reasons.push(`score ${site.strandedScore} ≥ ${a.minScore}`)
      if (a.minEmission != null && (site.emission ?? 0) >= a.minEmission) {
        reasons.push(`emission ${(site.emission ?? 0).toLocaleString()} ≥ ${a.minEmission.toLocaleString()} kg/d`)
      }
      if (!reasons.length) return null
      if (options?.skipRecentlyNotified && a.lastNotifiedAt) {
        const elapsed = now - new Date(a.lastNotifiedAt).getTime()
        if (elapsed < 30 * 60_000) return null
      }
      return {
        ...a,
        currentScore: site.strandedScore,
        currentEmission: site.emission ?? 0,
        reasons,
      }
    })
    .filter(Boolean) as WatchHit[]
}