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