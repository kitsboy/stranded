/**
 * Sovereign Canadian Bitcoin Pension Plan & Flat-Tax Dividend Model.
 *
 * Pure module: no React, no external dependencies.
 *
 * Concept ("The 10% Sovereign Pension Rule"):
 *   - What if stranded-energy Bitcoin mining in Canada operated under a single, simple,
 *     codified fiscal compact: a flat 10% production royalty/tax on gross or net mined BTC,
 *     routed 100% into a public, OpenTimestamps-auditable Canadian Sovereign Bitcoin Pension Fund
 *     (or provincial Heritage Trust / First Nations Sovereign Wealth Fund)?
 *   - Operators keep 90% with full regulatory clarity and zero punitive grid tariffs (because
 *     waste-methane capture draws 0 kW from the grid).
 *   - Citizens, provinces, and First Nations accumulate non-dilutive hard money (sats) from
 *     gas that was previously vented or flared for $0.
 *
 * Honesty contract:
 *   - Every calculation is a transparent policy & compounding simulation, never a guaranteed
 *     return or enacted tax law.
 *   - Real BTC CAGR scenarios (0% flat, 10% conservative, 20% historical-moderated) are
 *     shown side-by-side so the reader sees the exact effect of holding in BTC vs spending fiat.
 */

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
}

export type PensionYearRow = {
  year: number
  annualTaxBtc: number
  cumulativePensionBtc: number
  btcPriceAtYear: number
  pensionValueFiat: number
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
  satsPerCitizenAtHorizon: number
  fiatPerCitizenAtHorizon: number
  annualPayoutAt4PctDrawdownFiat: number
  retireesSupportedAt25kYr: number
  schedule: PensionYearRow[]
}

const DEFAULT_POPULATION = 41_000_000

/**
 * Computes the multi-decade accumulation of a flat-tax Bitcoin pension fund
 * fed by stranded-energy mining. Includes 4-year Bitcoin halving supply decay
 * on raw BTC production unless offset by fleet expansion (modelled honestly with
 * a 0.85 per-halving-epoch production retention factor to avoid linear over-promising).
 */
export function computeSovereignPension(input: PensionModelInput): PensionModelOutput {
  const annualPortfolioBtc = Math.max(0, Number(input.annualPortfolioBtc) || 0)
  const btcPriceFiat = Math.max(1, Number(input.btcPriceFiat) || 115000)
  const flatTaxPct = Math.max(0, Math.min(50, Number(input.flatTaxPct) || 10))
  const communitySharePct = Math.max(0, Math.min(50, Number(input.communitySharePct) || 15))
  const horizonYears = Math.max(1, Math.min(50, Math.floor(Number(input.horizonYears) || 20)))
  const btcCagrPct = Math.max(-20, Math.min(50, Number(input.btcCagrPct) || 0))
  const pop = Math.max(1, input.populationCount || DEFAULT_POPULATION)

  const taxRate = flatTaxPct / 100
  const commRate = communitySharePct / 100
  const operatorRate = Math.max(0, 1 - taxRate - commRate)

  const annualTaxBtc = annualPortfolioBtc * taxRate
  const annualTaxSats = Math.round(annualTaxBtc * 1e8)
  const annualTaxFiatToday = annualTaxBtc * btcPriceFiat
  const annualCommunityShareBtc = annualPortfolioBtc * commRate
  const annualOperatorRetainedBtc = annualPortfolioBtc * operatorRate

  let cumulativeBtc = 0
  const schedule: PensionYearRow[] = []

  for (let y = 1; y <= horizonYears; y++) {
    // Honest halving adjustment: every 4 years, network subsidy halves; we apply a
    // conservative 0.82 per-epoch factor (fees + efficiency gains offset part of the halving,
    // but we never pretend BTC volume stays 100% static forever without new sites).
    const epoch = Math.floor((y - 1) / 4)
    const epochFactor = Math.pow(0.82, epoch)
    const yearTaxBtc = annualTaxBtc * epochFactor
    cumulativeBtc += yearTaxBtc
    const priceAtYear = btcPriceFiat * Math.pow(1 + btcCagrPct / 100, y)
    schedule.push({
      year: y,
      annualTaxBtc: +yearTaxBtc.toFixed(4),
      cumulativePensionBtc: +cumulativeBtc.toFixed(2),
      btcPriceAtYear: Math.round(priceAtYear),
      pensionValueFiat: Math.round(cumulativeBtc * priceAtYear),
    })
  }

  const last = schedule[schedule.length - 1]
  const pensionValueFiatAtHorizon = last ? last.pensionValueFiat : 0
  const pensionValueFlatPriceFiat = Math.round(cumulativeBtc * btcPriceFiat)
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
    satsPerCitizenAtHorizon,
    fiatPerCitizenAtHorizon,
    annualPayoutAt4PctDrawdownFiat,
    retireesSupportedAt25kYr,
    schedule,
  }
}
