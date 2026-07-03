export type LiveStats = {
  generatedAt: string
  version: string
  siteCount: number
  provinceCount: number
  provinces: { name: string; count: number; pct: number }[]
  sourceTypes: { name: string; count: number; pct: number }[]
  gensetRecommendations: { id: string; count: number; pct: number }[]
  emissionTiers: Record<string, number>
  confidenceCounts: Record<string, number>
  totals: {
    emissionKgDay: number
    avgEmissionKgDay: number
    ch4TonnesYear: number
    avgStrandedScore: number
    totalGeneratorKW: number
    highScoreSites: number
  }
  impact: {
    co2eAvoided5PctTonnes: number
    co2eAvoided100PctTonnes: number
    sitesAt5Pct: number
    methaneGwp: number
  }
  valueModel: {
    defaultBtcUsd: number
    roughDailyBtc: number
    annualBtc: number
    annualRevenueUsd: number
    note: string
  }
  topSites: {
    id: string
    name: string
    province: string
    emissionKgDay: number
    score: number
    genset: string
    ch4TonnesYear: number
  }[]
  routes: Record<string, string>
  urls: {
    production: string
    github: string
    dataSource: string
  }
}