import { EnrichedSite } from './sites'
import { computeAdvancedRoi } from './roi-model'

export type TornadoRow = {
  param: string
  lowImpact: number
  highImpact: number
  /** absolute swing high-low for sorting */
  swing: number
}

/**
 * Relative daily-profit index sensitivity (base = 1.0).
 * Uses advanced ROI carbon + power proxies as a stable index when full profit chain is heavy.
 */
export function sensitivityTornado(site: EnrichedSite, liveBtcUsd = 85000): TornadoRow[] {
  const base = computeAdvancedRoi(site, (site.recommendedGenset as any) || 'jenbacher316', {
    liveBtcUsd,
    difficultyMultiplier: 1,
    gasTreatmentDerate: 1,
  })
  const baseIdx = Math.max(base.powerKW * (liveBtcUsd / 85000) + base.carbonRevenueUsd / 1000, 0.001)

  type RoiPartial = NonNullable<Parameters<typeof computeAdvancedRoi>[2]>
  const scenarios: { param: string; low: RoiPartial; high: RoiPartial }[] = [
    {
      param: 'BTC price (±30%)',
      low: { liveBtcUsd: liveBtcUsd * 0.7 },
      high: { liveBtcUsd: liveBtcUsd * 1.3 },
    },
    {
      param: 'Gas treatment / H₂S derate',
      low: { liveBtcUsd, gasTreatmentDerate: 0.75 },
      high: { liveBtcUsd, gasTreatmentDerate: 1.0 },
    },
    {
      param: 'Network difficulty',
      low: { liveBtcUsd, difficultyMultiplier: 1.4 },
      high: { liveBtcUsd, difficultyMultiplier: 0.85 },
    },
    {
      param: 'Carbon credit price',
      low: { liveBtcUsd, carbonCreditUsdPerTonne: 20 },
      high: { liveBtcUsd, carbonCreditUsdPerTonne: 80 },
    },
  ]

  const rows: TornadoRow[] = scenarios.map(sc => {
    const lowR = computeAdvancedRoi(site, (site.recommendedGenset as any) || 'jenbacher316', sc.low)
    const highR = computeAdvancedRoi(site, (site.recommendedGenset as any) || 'jenbacher316', sc.high)
    const lowBtc = sc.low.liveBtcUsd ?? liveBtcUsd
    const highBtc = sc.high.liveBtcUsd ?? liveBtcUsd
    const lowIdx = (lowR.powerKW * (lowBtc / 85000) + lowR.carbonRevenueUsd / 1000) / baseIdx
    const highIdx = (highR.powerKW * (highBtc / 85000) + highR.carbonRevenueUsd / 1000) / baseIdx
    return {
      param: sc.param,
      lowImpact: Math.round(lowIdx * 100) / 100,
      highImpact: Math.round(highIdx * 100) / 100,
      swing: Math.abs(highIdx - lowIdx),
    }
  })

  return rows.sort((a, b) => b.swing - a.swing)
}
