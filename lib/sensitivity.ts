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
 * Composite value index that moves with every tornado lever:
 * - annualRevenueUsd responds to BTC price, difficultyMultiplier, gas derate (via ASICs/power)
 * - carbonRevenueUsd responds to carbon credit price
 */
export function sensitivityIndex(roi: {
  annualRevenueUsd: number
  carbonRevenueUsd: number
}): number {
  return Math.max(roi.annualRevenueUsd + roi.carbonRevenueUsd, 0.001)
}

/**
 * Relative value-index sensitivity (base = 1.0).
 * Index = mining annual revenue (USD) + carbon credit USD — both from computeAdvancedRoi.
 */
export function sensitivityTornado(site: EnrichedSite, liveBtcUsd = 85000): TornadoRow[] {
  const genset = (site.recommendedGenset as any) || 'jenbacher316'
  const base = computeAdvancedRoi(site, genset, {
    liveBtcUsd,
    difficultyMultiplier: 1,
    gasTreatmentDerate: 1,
  })
  const baseIdx = sensitivityIndex(base)

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
      // higher difficultyMultiplier = higher modeled hashprice proxy in roi-model (scales dailyBtc)
      low: { liveBtcUsd, difficultyMultiplier: 0.7 },
      high: { liveBtcUsd, difficultyMultiplier: 1.3 },
    },
    {
      param: 'Carbon credit price',
      low: { liveBtcUsd, carbonCreditUsdPerTonne: 20 },
      high: { liveBtcUsd, carbonCreditUsdPerTonne: 80 },
    },
  ]

  const rows: TornadoRow[] = scenarios.map(sc => {
    const lowR = computeAdvancedRoi(site, genset, sc.low)
    const highR = computeAdvancedRoi(site, genset, sc.high)
    const lowIdx = sensitivityIndex(lowR) / baseIdx
    const highIdx = sensitivityIndex(highR) / baseIdx
    return {
      param: sc.param,
      lowImpact: Math.round(lowIdx * 100) / 100,
      highImpact: Math.round(highIdx * 100) / 100,
      swing: Math.abs(highIdx - lowIdx),
    }
  })

  return rows.sort((a, b) => b.swing - a.swing)
}
