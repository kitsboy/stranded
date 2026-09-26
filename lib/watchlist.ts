/**
 * Watchlist — "star a site, get pinged when its economics move".
 *
 * Local-first (no backend): each watched site stores the payback (days) and
 * daily profit (fiat) it had when you watched it. On a later visit we compare
 * against the current build and surface a "your watch moved" alert. Honest:
 * this is a same-browser comparison, not a server push — it alerts on the next
 * load, not in real time.
 */
const WATCH_KEY = 'stranded-watchlist'

export type WatchEntry = {
  siteId: string
  /** Payback in days when the site was watched. */
  paybackDays: number
  /** Daily net profit (fiat) when watched. */
  dailyProfitFiat: number
  /** ISO timestamp of when it was watched. */
  watchedAt: string
}

export function getWatchlist(): WatchEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(WATCH_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter(e => e && e.siteId)
  } catch { return [] }
}

function saveWatchlist(entries: WatchEntry[]) {
  localStorage.setItem(WATCH_KEY, JSON.stringify(entries))
}

export function isWatched(siteId: string): boolean {
  return getWatchlist().some(e => e.siteId === siteId)
}

export function getWatchEntry(siteId: string): WatchEntry | null {
  return getWatchlist().find(e => e.siteId === siteId) || null
}

/** Add or refresh a watch with the current build economics. */
export function watchSite(siteId: string, paybackDays: number, dailyProfitFiat: number): WatchEntry[] {
  const list = getWatchlist().filter(e => e.siteId !== siteId)
  const entry: WatchEntry = { siteId, paybackDays, dailyProfitFiat, watchedAt: new Date().toISOString() }
  const next = [...list, entry]
  saveWatchlist(next)
  return next
}

export function unwatchSite(siteId: string): WatchEntry[] {
  const next = getWatchlist().filter(e => e.siteId !== siteId)
  saveWatchlist(next)
  return next
}

export type WatchDelta = {
  entry: WatchEntry
  /** New payback in days. */
  newPaybackDays: number
  /** New daily profit (fiat). */
  newDailyProfitFiat: number
  /** Signed % change in payback (negative = faster payback = better). */
  paybackPctChange: number
  /** Signed % change in daily profit. */
  profitPctChange: number
}

/**
 * Compare a watched site's stored economics against the current build.
 * Returns null when the site isn't watched or nothing moved meaningfully.
 */
export function watchDelta(
  siteId: string,
  paybackDays: number,
  dailyProfitFiat: number,
  thresholdPct = 5,
): WatchDelta | null {
  const entry = getWatchEntry(siteId)
  if (!entry) return null
  const oldPayback = entry.paybackDays
  const oldProfit = entry.dailyProfitFiat
  const paybackPct = oldPayback > 0 ? ((paybackDays - oldPayback) / oldPayback) * 100 : 0
  const profitPct = oldProfit !== 0 ? ((dailyProfitFiat - oldProfit) / Math.abs(oldProfit)) * 100 : 0
  if (Math.abs(paybackPct) < thresholdPct && Math.abs(profitPct) < thresholdPct) return null
  return {
    entry,
    newPaybackDays: paybackDays,
    newDailyProfitFiat: dailyProfitFiat,
    paybackPctChange: paybackPct,
    profitPctChange: profitPct,
  }
}
