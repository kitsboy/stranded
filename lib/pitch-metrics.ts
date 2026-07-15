import type { LiveStats } from '@/types/live-stats'

export type ProvinceOpportunity = {
  name: string
  sites: number
  pct: number
  estKgDay: number
  estRevenueUsd: number
  estBtcYr: number
}

export function provinceOpportunities(stats: LiveStats): ProvinceOpportunity[] {
  const { emissionKgDay } = stats.totals
  const { annualRevenueUsd, annualBtc } = stats.valueModel
  return stats.provinces
    .map(p => {
      const share = p.pct / 100
      return {
        name: p.name,
        sites: p.count,
        pct: p.pct,
        estKgDay: Math.round(emissionKgDay * share),
        estRevenueUsd: Math.round(annualRevenueUsd * share),
        estBtcYr: annualBtc * share,
      }
    })
    .sort((a, b) => b.estRevenueUsd - a.estRevenueUsd)
}

export type CaptureProjection = {
  capturePct: number
  sites: number
  co2eTonnes: number
  btcYr: number
  revenueUsd: number
  generatorKw: number
}

export function portfolioCaptureProjection(stats: LiveStats, capturePct: number): CaptureProjection {
  const pct = Math.max(0, Math.min(100, capturePct)) / 100
  const fullCo2e = stats.impact.co2eAvoided100PctTonnes
  const sites = Math.round(stats.siteCount * pct)
  return {
    capturePct: Math.round(capturePct),
    sites,
    co2eTonnes: Math.round(fullCo2e * pct),
    btcYr: stats.valueModel.annualBtc * pct,
    revenueUsd: Math.round(stats.valueModel.annualRevenueUsd * pct),
    generatorKw: Math.round(stats.totals.totalGeneratorKW * pct),
  }
}

export function scoreHistogramToScores(histogram: { bucket: string; count: number }[]): number[] {
  const scores: number[] = []
  histogram.forEach((b, i) => {
    const mid = i * 10 + 5
    for (let j = 0; j < b.count; j++) scores.push(mid + (j % 3) - 1)
  })
  return scores
}