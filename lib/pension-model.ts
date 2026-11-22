/**
 * Sovereign Canadian Bitcoin Pension Plan & Flat-Tax Dividend Model.
 *
 * Pure module: no React, no external dependencies.
 *
 * Includes:
 *   - National, Provincial Heritage Trust (AB, BC, ON, SK), and First Nations Sovereign Trust modes
 *   - 10% Flat BTC Royalty vs. Status-Quo Punitive Corporate/Carbon Regime comparison
 *   - CPP Investments (C$675B) & Norway GPFG (C$2.3T) sovereign wealth benchmark overlays
 *   - Compact base64url `#pension=...` shareable URL hash encoder/decoder
 *   - Print-ready whitepaper Markdown/HTML generator
 */

export type PensionTrustId =
  | 'canada-national'
  | 'alberta-heritage'
  | 'bc-prosperity'
  | 'ontario-municipal'
  | 'sask-sovereign'
  | 'first-nations-trust'

export type PensionTrustProfile = {
  id: PensionTrustId
  name: string
  flag: string
  siteSharePct: number
  siteCount: number
  population: number
  benchmarkAumCad: number
  benchmarkLabel: string
  description: string
}

export const PENSION_TRUST_PROFILES: PensionTrustProfile[] = [
  {
    id: 'canada-national',
    name: 'Canada Sovereign Bitcoin Pension (National)',
    flag: '🇨🇦',
    siteSharePct: 100,
    siteCount: 2611,
    population: 41_000_000,
    benchmarkAumCad: 675_000_000_000,
    benchmarkLabel: 'CPP Investments (~C$675B AUM)',
    description: 'All 2,611 ECCC methane sites across 13 provinces & territories feeding a single national Bitcoin reserve.',
  },
  {
    id: 'alberta-heritage',
    name: 'Alberta Heritage Savings Bitcoin Trust',
    flag: '🏔️',
    siteSharePct: 45.0,
    siteCount: 1176,
    population: 4_800_000,
    benchmarkAumCad: 24_000_000_000,
    benchmarkLabel: 'Alberta Heritage Trust (~C$24B AUM)',
    description: '1,176 Alberta oil, gas, oil sands & landfill sites (45% of national methane) compounding inside the Heritage Fund.',
  },
  {
    id: 'bc-prosperity',
    name: 'BC Clean Energy & Prosperity Bitcoin Trust',
    flag: '🌲',
    siteSharePct: 11.3,
    siteCount: 296,
    population: 5_600_000,
    benchmarkAumCad: 250_000_000_000,
    benchmarkLabel: 'BCI Provincial Pension (~C$250B AUM)',
    description: '296 British Columbia coal-mine, Montney gas, pulp & municipal landfill sites.',
  },
  {
    id: 'ontario-municipal',
    name: 'Ontario Municipal & SMR Sovereign Reserve',
    flag: '🏛️',
    siteSharePct: 17.4,
    siteCount: 454,
    population: 16_000_000,
    benchmarkAumCad: 133_000_000_000,
    benchmarkLabel: 'OMERS Municipal Pension (~C$133B AUM)',
    description: '454 Ontario sites including 4 of Canada’s top 5 mega-landfills plus Phase 3 Darlington/Bruce SMR surplus.',
  },
  {
    id: 'sask-sovereign',
    name: 'Saskatchewan Resource & SMR Heritage Fund',
    flag: '🌾',
    siteSharePct: 10.7,
    siteCount: 280,
    population: 1_240_000,
    benchmarkAumCad: 12_000_000_000,
    benchmarkLabel: 'Saskatchewan Pension Benchmark (~C$12B)',
    description: '280 Saskatchewan flare/vent sites plus future Estevan/SaskPower SMR baseload.',
  },
  {
    id: 'first-nations-trust',
    name: 'First Nations Sovereign Wealth & Remediation Trust',
    flag: '🦅',
    siteSharePct: 28.4,
    siteCount: 742,
    population: 1_800_000,
    benchmarkAumCad: 10_000_000_000,
    benchmarkLabel: 'Indigenous Sovereign Infrastructure Target (C$10B)',
    description: '742 sites overlapping Treaty 6, 7, 8, Northern BC, SK, ON & Northern territories with AIOC/CIB loan guarantees.',
  },
]

export type PensionModelInput = {
  /** Total annual BTC mined across the deployed portfolio. */
  annualPortfolioBtc: number
  /** Current BTC price in CAD (or selected fiat). */
  btcPriceFiat: number
  /** Flat pension tax/royalty rate in % (default 10%). */
  flatTaxPct: number
  /** Optional First Nations & Community revenue-share % on top or inside compact (default 15%). */
  communitySharePct: number
  /** Accumulation horizon in years (e.g. 10, 20, 30). */
  horizonYears: number
  /** Annual BTC price appreciation scenario in % (0 = flat real price, 12 = moderate). */
  btcCagrPct: number
  /** Canadian population benchmark for per-citizen / per-retiree math (default 41,000,000). */
  populationCount?: number
  /** Optional benchmark AUM in CAD for basis-point comparison. */
  benchmarkAumCad?: number
}

export type PensionYearRow = {
  year: number
  annualTaxBtc: number
  cumulativePensionBtc: number
  btcPriceAtYear: number
  pensionValueFiat: number
  statusQuoCumulativeFiat: number
}

export type PensionModelOutput = {
  annualTaxBtc: number
  annualTaxSats: number
  annualTaxFiatToday: number
  annualOperatorRetainedBtc: number
  annualCommunityShareBtc: number
  cumulativeBtcAtHorizon: number
  pensionValueFiatAtHorizon: number
  pensionValueFlatPriceFiat: number
  /** Status-quo punitive tax regime (high friction -> only ~15% capital deployment, spent in fiat with 0% BTC compounding). */
  statusQuoFiatAtHorizon: number
  sovereignAdvantageMultiple: number
  benchmarkSharePct: number
  norwayGpfgSharePct: number
  satsPerCitizenAtHorizon: number
  fiatPerCitizenAtHorizon: number
  annualPayoutAt4PctDrawdownFiat: number
  retireesSupportedAt25kYr: number
  schedule: PensionYearRow[]
}

const DEFAULT_POPULATION = 41_000_000
const NORWAY_GPFG_CAD = 2_300_000_000_000

export function computeSovereignPension(input: PensionModelInput): PensionModelOutput {
  const annualPortfolioBtc = Math.max(0, Number(input.annualPortfolioBtc) || 0)
  const btcPriceFiat = Math.max(1, Number(input.btcPriceFiat) || 115000)
  const flatTaxPct = Math.max(0, Math.min(50, Number(input.flatTaxPct) || 10))
  const communitySharePct = Math.max(0, Math.min(50, Number(input.communitySharePct) || 15))
  const horizonYears = Math.max(1, Math.min(50, Math.floor(Number(input.horizonYears) || 20)))
  const btcCagrPct = Math.max(-20, Math.min(50, Number(input.btcCagrPct) || 0))
  const pop = Math.max(1, input.populationCount || DEFAULT_POPULATION)
  const benchmarkAum = Math.max(1, input.benchmarkAumCad || 675_000_000_000)

  const taxRate = flatTaxPct / 100
  const commRate = communitySharePct / 100
  const operatorRate = Math.max(0, 1 - taxRate - commRate)

  const annualTaxBtc = annualPortfolioBtc * taxRate
  const annualTaxSats = Math.round(annualTaxBtc * 1e8)
  const annualTaxFiatToday = annualTaxBtc * btcPriceFiat
  const annualCommunityShareBtc = annualPortfolioBtc * commRate
  const annualOperatorRetainedBtc = annualPortfolioBtc * operatorRate

  let cumulativeBtc = 0
  let statusQuoCumulativeFiat = 0
  const schedule: PensionYearRow[] = []

  for (let y = 1; y <= horizonYears; y++) {
    const epoch = Math.floor((y - 1) / 4)
    const epochFactor = Math.pow(0.82, epoch)
    const yearTaxBtc = annualTaxBtc * epochFactor
    cumulativeBtc += yearTaxBtc
    const priceAtYear = btcPriceFiat * Math.pow(1 + btcCagrPct / 100, y)
    // Status quo comparison: complex 27%+ corporate/carbon tax deters ~80% of mobile capital
    // (only 20% of sites get built) and tax receipts are spent in fiat rather than compounded in BTC.
    const statusQuoAnnualFiat = (annualPortfolioBtc * 0.20 * epochFactor) * 0.27 * btcPriceFiat
    statusQuoCumulativeFiat += statusQuoAnnualFiat
    schedule.push({
      year: y,
      annualTaxBtc: +yearTaxBtc.toFixed(4),
      cumulativePensionBtc: +cumulativeBtc.toFixed(2),
      btcPriceAtYear: Math.round(priceAtYear),
      pensionValueFiat: Math.round(cumulativeBtc * priceAtYear),
      statusQuoCumulativeFiat: Math.round(statusQuoCumulativeFiat),
    })
  }

  const last = schedule[schedule.length - 1]
  const pensionValueFiatAtHorizon = last ? last.pensionValueFiat : 0
  const pensionValueFlatPriceFiat = Math.round(cumulativeBtc * btcPriceFiat)
  const statusQuoFiatAtHorizon = last ? last.statusQuoCumulativeFiat : 0
  const sovereignAdvantageMultiple =
    statusQuoFiatAtHorizon > 0 ? +(pensionValueFiatAtHorizon / statusQuoFiatAtHorizon).toFixed(1) : 1
  const benchmarkSharePct = +((pensionValueFiatAtHorizon / benchmarkAum) * 100).toFixed(2)
  const norwayGpfgSharePct = +((pensionValueFiatAtHorizon / NORWAY_GPFG_CAD) * 100).toFixed(2)

  const satsPerCitizenAtHorizon = Math.round((cumulativeBtc * 1e8) / pop)
  const fiatPerCitizenAtHorizon = Math.round(pensionValueFiatAtHorizon / pop)
  const annualPayoutAt4PctDrawdownFiat = Math.round(pensionValueFiatAtHorizon * 0.04)
  const retireesSupportedAt25kYr = Math.floor(annualPayoutAt4PctDrawdownFiat / 25000)

  return {
    annualTaxBtc: +annualTaxBtc.toFixed(2),
    annualTaxSats,
    annualTaxFiatToday: Math.round(annualTaxFiatToday),
    annualOperatorRetainedBtc: +annualOperatorRetainedBtc.toFixed(2),
    annualCommunityShareBtc: +annualCommunityShareBtc.toFixed(2),
    cumulativeBtcAtHorizon: +cumulativeBtc.toFixed(2),
    pensionValueFiatAtHorizon,
    pensionValueFlatPriceFiat,
    statusQuoFiatAtHorizon,
    sovereignAdvantageMultiple,
    benchmarkSharePct,
    norwayGpfgSharePct,
    satsPerCitizenAtHorizon,
    fiatPerCitizenAtHorizon,
    annualPayoutAt4PctDrawdownFiat,
    retireesSupportedAt25kYr,
    schedule,
  }
}

export type PensionShareState = {
  trustId: PensionTrustId
  capturePct: number
  flatTaxPct: number
  communitySharePct: number
  horizonYears: number
  btcCagrPct: number
  nuclear: boolean
}

export function encodePensionHash(state: PensionShareState): string {
  const payload = JSON.stringify(state)
  if (typeof btoa === 'undefined') return Buffer.from(payload, 'utf8').toString('base64url')
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodePensionHash(token: string): PensionShareState | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const json = typeof atob !== 'undefined' ? atob(padded) : Buffer.from(padded, 'base64').toString('utf8')
    const d = JSON.parse(json) as Partial<PensionShareState>
    if (!d || typeof d.capturePct !== 'number') return null
    return {
      trustId: d.trustId || 'canada-national',
      capturePct: Math.max(5, Math.min(100, d.capturePct)),
      flatTaxPct: Math.max(5, Math.min(25, d.flatTaxPct ?? 10)),
      communitySharePct: Math.max(0, Math.min(40, d.communitySharePct ?? 15)),
      horizonYears: Math.max(5, Math.min(35, d.horizonYears ?? 20)),
      btcCagrPct: Math.max(0, Math.min(25, d.btcCagrPct ?? 12)),
      nuclear: !!d.nuclear,
    }
  } catch {
    return null
  }
}
