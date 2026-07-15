export function formatRelativeTime(iso: string | Date): string {
  const then = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime()
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (!Number.isFinite(diffSec) || diffSec < 0) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(then).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}