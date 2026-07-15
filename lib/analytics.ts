/** Privacy-first local analytics — no third-party trackers. */

const EVENTS_KEY = 'stranded-analytics-events'

export type AnalyticsCategory =
  | 'navigation'
  | 'map'
  | 'portfolio'
  | 'export'
  | 'education'
  | 'search'
  | 'settings'
  | 'share'

export type AnalyticsEvent = {
  name: string
  category: AnalyticsCategory
  meta?: Record<string, string | number>
  at: string
}

const CATEGORY_PREFIX: Record<AnalyticsCategory, string> = {
  navigation: 'nav',
  map: 'map',
  portfolio: 'mission',
  export: 'export',
  education: 'edu',
  search: 'search',
  settings: 'settings',
  share: 'share',
}

export function trackEvent(
  name: string,
  meta?: Record<string, string | number>,
  category: AnalyticsCategory = 'navigation',
) {
  if (typeof window === 'undefined') return
  try {
    const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]')
    events.push({ name, category, meta, at: new Date().toISOString() })
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-100)))
  } catch { /* ignore */ }
}

export function trackCategory(
  category: AnalyticsCategory,
  action: string,
  meta?: Record<string, string | number>,
) {
  trackEvent(`${CATEGORY_PREFIX[category]}:${action}`, meta, category)
}

export function getLocalAnalytics(): AnalyticsEvent[] {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
}

export function getAnalyticsByCategory(category: AnalyticsCategory): AnalyticsEvent[] {
  return getLocalAnalytics().filter(e => e.category === category)
}

export function clearLocalAnalytics() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(EVENTS_KEY)
}