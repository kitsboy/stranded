export function buildShareableMapUrl(
  origin: string,
  state: Record<string, string | number | string[] | undefined | null>,
): string {
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(state)) {
    if (value == null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) p.set(key, value.join(','))
    } else {
      p.set(key, String(value))
    }
  }
  const q = p.toString()
  const base = origin.replace(/\/$/, '')
  return q ? `${base}/map?${q}` : `${base}/map`
}
