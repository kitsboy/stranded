import { EnrichedSite } from './sites'

/** Peer sites: same province + source type, ranked by score proximity then emission. */
export function findPeerSites(
  site: EnrichedSite,
  all: EnrichedSite[],
  limit = 5
): EnrichedSite[] {
  const province = site.properties.province
  const source = site.properties.source_type
  return all
    .filter(s => s.id !== site.id)
    .filter(s => {
      if (province && s.properties.province !== province) return false
      if (source && s.properties.source_type !== source) return false
      return true
    })
    .sort((a, b) => {
      const da = Math.abs(a.strandedScore - site.strandedScore)
      const db = Math.abs(b.strandedScore - site.strandedScore)
      if (da !== db) return da - db
      return b.emission - a.emission
    })
    .slice(0, limit)
}

/** Sites similar by emission band (±25%) anywhere in Canada */
export function findSimilarByEmission(site: EnrichedSite, all: EnrichedSite[], limit = 5): EnrichedSite[] {
  const lo = site.emission * 0.75
  const hi = site.emission * 1.25
  return all
    .filter(s => s.id !== site.id && s.emission >= lo && s.emission <= hi)
    .sort((a, b) => Math.abs(a.emission - site.emission) - Math.abs(b.emission - site.emission))
    .slice(0, limit)
}

export function peerSummary(site: EnrichedSite, peers: EnrichedSite[]): {
  count: number
  avgScore: number
  avgEmission: number
  rankByScore: number
} {
  if (!peers.length) {
    return { count: 0, avgScore: site.strandedScore, avgEmission: site.emission, rankByScore: 1 }
  }
  const pool = [site, ...peers]
  const avgScore = pool.reduce((a, s) => a + s.strandedScore, 0) / pool.length
  const avgEmission = pool.reduce((a, s) => a + s.emission, 0) / pool.length
  const rankByScore = [...pool].sort((a, b) => b.strandedScore - a.strandedScore).findIndex(s => s.id === site.id) + 1
  return {
    count: peers.length,
    avgScore: Math.round(avgScore * 10) / 10,
    avgEmission: Math.round(avgEmission),
    rankByScore,
  }
}
