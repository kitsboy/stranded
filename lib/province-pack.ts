export type ProvincePackSite = {
  id: string
  properties?: { name?: string; province?: string }
  strandedScore?: number
  emission?: number
  province?: string
  name?: string
  score?: number
}

export function filterSitesByProvince<T extends ProvincePackSite>(sites: T[], province: string): T[] {
  const target = province.toLowerCase()
  return sites.filter(s => {
    const p = (s.properties?.province || s.province || '').toLowerCase()
    return p === target || p.includes(target)
  })
}

export function provincePackSummary(sites: ProvincePackSite[]): {
  count: number
  avgScore: number
  totalEmission: number
  topNames: string[]
} {
  if (!sites.length) return { count: 0, avgScore: 0, totalEmission: 0, topNames: [] }
  const scores = sites.map(s => s.strandedScore ?? s.score ?? 0)
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const totalEmission = sites.reduce((a, s) => a + (s.emission || 0), 0)
  const topNames = [...sites]
    .sort((a, b) => (b.strandedScore ?? b.score ?? 0) - (a.strandedScore ?? a.score ?? 0))
    .slice(0, 5)
    .map(s => s.properties?.name || s.name || s.id)
  return { count: sites.length, avgScore, totalEmission: Math.round(totalEmission), topNames }
}
