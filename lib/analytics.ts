/** Privacy-first local analytics — no third-party trackers. */

const EVENTS_KEY = 'stranded-analytics-events'

export function trackEvent(name: string, meta?: Record<string, string | number>) {
  if (typeof window === 'undefined') return
  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]')
    events.push({ name, meta, at: new Date().toISOString() })
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-100)))
  } catch { /* ignore */ }
}

export function getLocalAnalytics() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]') } catch { return [] }
}