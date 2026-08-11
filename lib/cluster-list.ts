/**
 * Helpers for cluster-click → site list drawers.
 */

export type ClusterListItem = {
  id: string
  name: string
  score: number
  emission: number
  province?: string
  distanceKm?: number
}

export function rankClusterSites(
  items: ClusterListItem[],
  sort: 'score' | 'emission' | 'name' = 'score',
): ClusterListItem[] {
  const copy = [...items]
  if (sort === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name))
  }
  if (sort === 'emission') {
    return copy.sort((a, b) => b.emission - a.emission)
  }
  return copy.sort((a, b) => b.score - a.score || b.emission - a.emission)
}

export function clusterSummary(items: ClusterListItem[]): {
  count: number
  avgScore: number
  totalEmission: number
  topName: string | null
} {
  if (!items.length) return { count: 0, avgScore: 0, totalEmission: 0, topName: null }
  const totalEmission = items.reduce((s, i) => s + (i.emission || 0), 0)
  const avgScore = Math.round(items.reduce((s, i) => s + (i.score || 0), 0) / items.length)
  const top = rankClusterSites(items, 'score')[0]
  return { count: items.length, avgScore, totalEmission, topName: top?.name || null }
}
