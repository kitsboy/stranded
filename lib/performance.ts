/**
 * Navigation timing stubs — mark route transitions for future RUM.
 * Safe no-op when Performance API unavailable (SSR, old browsers).
 */

export function markNavigation(name: string): void {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') return
  try {
    performance.mark(`stranded:nav:${name}`)
  } catch {
    /* quota or unsupported */
  }
}

export function measureNavigation(from: string, to: string): PerformanceMeasure | null {
  if (typeof performance === 'undefined' || typeof performance.measure !== 'function') return null
  const start = `stranded:nav:${from}`
  const end = `stranded:nav:${to}`
  try {
    return performance.measure(`stranded:nav:${from}->${to}`, start, end)
  } catch {
    return null
  }
}

export function clearNavigationMarks(): void {
  if (typeof performance === 'undefined' || typeof performance.clearMarks !== 'function') return
  try {
    performance.getEntriesByType('mark')
      .filter(e => e.name.startsWith('stranded:nav:'))
      .forEach(e => performance.clearMarks(e.name))
  } catch {
    /* ignore */
  }
}

/** Mark when a data-driven page has finished its primary stats fetch. */
export function markPageReady(route: string): void {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') return
  const mark = `stranded:ready:${route}`
  try {
    performance.mark(mark)
    if (typeof performance.measure === 'function') {
      performance.measure(`stranded:${route}:stats-loaded`, undefined, mark)
    }
  } catch {
    /* quota or unsupported */
  }
}