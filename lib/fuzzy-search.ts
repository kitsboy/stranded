/** Simple fuzzy score: exact > startsWith > includes */
export function fuzzyScore(query: string, ...fields: (string | undefined | null)[]): number {
  const q = query.toLowerCase().trim()
  if (!q) return 0
  let best = 0
  for (const field of fields) {
    const t = (field || '').toLowerCase()
    if (!t) continue
    if (t === q) best = Math.max(best, 100)
    else if (t.startsWith(q)) best = Math.max(best, 80)
    else if (t.includes(q)) best = Math.max(best, 50)
  }
  return best
}