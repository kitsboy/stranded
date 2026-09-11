/**
 * Fleet economics — the single source of truth for "what does this build earn".
 *
 * The arithmetic here was moved verbatim out of components/SiteDetailsPanel.tsx so
 * that the site cockpit's live preview (drag / +/− / typed count) and the panel's
 * committed readouts, exports and share links can never drift apart. Behaviour is
 * intentionally identical to the previous in-component `useMemo` — this file is a
 * refactor of the *plumbing*, not of the model. No defaults, rates or formulas were
 * changed.
 *
 * Pure module: no React, no dependencies, unit-tested by scripts/test-helpers.mjs.
 */
import { siteGasCeilingKw, minerCeiling, type FleetGenset, type FleetSite } from './fleet-template'
import { GENSET_DATA } from './sites'

/**
 * The BTC-per-TH-per-day rate the app ships as its default assumption.
 * This is deliberately OPTIMISTIC vs the network-derived figure below — the app
 * ships it because it is Cam's call to keep published paybacks stable, but it must
 * never be shown as "neutral". Any build using this rate is an "optimistic scenario".
 */
export const NETWORK_ESTIMATE_BTC_PER_TH_DAY = 0.0000009

/**
 * Network-derived hashprice inputs, exposed honestly.
 * dailyBtcIssuance / networkHashrateThs = networkDerivedBtcPerThDay.
 * As of the 2024 halving: block subsidy + approximate fees ≈ 450 BTC/day across a
 * network of ≈1.1 ZH/s. These are visible assumptions, not hidden constants.
 */
export const NETWORK_DAILY_BTC_ISSUANCE = 450
export const NETWORK_HASHRATE_THS = 1_100_000_000 // ≈1.1 ZH/s
/** ≈ 0.000000409 BTC/TH/day — the honest network-derived reference. */
export const NETWORK_DERIVED_BTC_PER_TH_DAY = NETWORK_DAILY_BTC_ISSUANCE / NETWORK_HASHRATE_THS

/** Assumed power cost in USD/kWh used by the base model (advanced panel can restate it). */
export const DEFAULT_POWER_COST_USD_PER_KWH = 0.04

/** Rough CAD per USD used across the app when converting CAD hardware costs to BTC. */
export const CAD_PER_USD = 1.35

export type FleetModelAsic = {
  id?: string
  name?: string
  hashrate_ths: number
  power_w: number
  cost_cad: number
}

export type FleetModelInput = {
  site: FleetSite | null | undefined
  gensets: FleetGenset[]
  asic: FleetModelAsic
  machineCount: number
  overclockPercent: number
  /** Price of 1 BTC in the *selected* fiat. */
  btcPrice: number
  btcPrices: { usd: number; eur: number; jpy: number; gbp: number; cad: number }
  uptimePercent: number
  poolFeePercent: number
  maintenanceAnnualPercent: number
  revenuePerThPerDayBtc: number
  fixedSetupCostCad: number
  /** Power cost in USD/kWh. Defaults to DEFAULT_POWER_COST_USD_PER_KWH (0.04 grid-ish); a stranded-gas site is O&M-only. */
  powerCostUsdPerKwh?: number
  debtPercent: number
  interestRate: number
  /** Human label for the genset inventory (e.g. "1 × INNIO Jenbacher J316"). */
  gensetName?: string
}

export type FleetModel = {
  effectiveDailyBtc: number
  dailyRevenueBtc: number
  dailyRevenueFiat: number
  dailyPowerCostBtc: number
  dailyPowerCostFiat: number
  dailyMaintBtc: number
  dailyMaintFiat: number
  dailyProfitBtc: number
  dailyProfitFiat: number
  monthlyProfitBtc: number
  monthlyProfitFiat: number
  hardwareCostBtc: number
  hardwareCostFiat: number
  fixedCostBtc: number
  fixedCostFiat: number
  totalInvestmentBtc: number
  totalInvestmentFiat: number
  paybackDays: number
  marginalPayback: number
  totalPowerKw: number
  generatorPowerKw: number
  gensetCapexBtc: number
  methaneLossDailyBtc: number
  financedPaybackDays: number
  effectiveMachineCount: number
  gensetName: string
  /** Miners the gas ceiling actually powers (floor) — the honest maximum. */
  ceilingMiners: number
  /** kW the miners in this build draw, before clamping to the gas ceiling. */
  usedPowerKw: number
  /** $/TH/day implied by the hashprice assumption, in USD. */
  hashpriceUsdPerThDay: number
}

/**
 * One site + one build → every number the cockpit, the ROI summary and the exports
 * quote. Identical arithmetic to the panel's original inline model.
 */
export function computeFleetModel(input: FleetModelInput): FleetModel {
  const {
    site, gensets, asic, machineCount, overclockPercent, btcPrice, btcPrices,
    uptimePercent, poolFeePercent, maintenanceAnnualPercent, revenuePerThPerDayBtc,
    fixedSetupCostCad, debtPercent, interestRate, gensetName = 'no genset',
  } = input

  const powerCostUsdPerKwh = input.powerCostUsdPerKwh ?? DEFAULT_POWER_COST_USD_PER_KWH

  const overclockMultiplier = 1 + (overclockPercent / 100)
  const adjustedHashrate = asic.hashrate_ths * overclockMultiplier
  const adjustedPower = asic.power_w * overclockMultiplier * (1 + overclockPercent / 200)
  const totalPowerKw = (adjustedPower * machineCount) / 1000

  // Generator integration: limit power from site's real emission using the genset stack (gas ceiling)
  const generatorPowerKw = siteGasCeilingKw(site, gensets)
  const effectivePowerKw = Math.min(totalPowerKw, generatorPowerKw)
  const ceilingMiners = minerCeiling(generatorPowerKw, asic.power_w)
  const effectiveMachineCount = Math.min(machineCount, minerCeiling(generatorPowerKw, asic.power_w))

  // Honest revenue: use editable per-TH/day BTC rate (accounts for current difficulty, fees, etc.)
  const dailyBtcGross = adjustedHashrate * effectiveMachineCount * revenuePerThPerDayBtc
  const dailyBtcAfterPool = dailyBtcGross * (1 - poolFeePercent / 100)
  const effectiveDailyBtc = dailyBtcAfterPool * (uptimePercent / 100)

  const btcPriceInFiat = btcPrice

  const dailyRevenueBtc = effectiveDailyBtc
  const dailyRevenueFiat = effectiveDailyBtc * btcPriceInFiat

  // Power cost: base assumption 0.04 in USD/kWh (grid-like), editable via the advanced panel; converted via BTC rates for honesty across currencies
  const powerCostUsd = effectivePowerKw * 24 * powerCostUsdPerKwh
  const usdBtcPrice = btcPrices.usd || 85000
  const dailyPowerCostBtc = powerCostUsd / usdBtcPrice
  const dailyPowerCostFiat = dailyPowerCostBtc * btcPriceInFiat

  // Maintenance as annual % of hardware investment (realistic opex)
  const cadBtcPrice = btcPrices.cad || 115000
  const hardwareCostBtc = (asic.cost_cad * effectiveMachineCount) / cadBtcPrice
  const hardwareCostFiat = hardwareCostBtc * btcPriceInFiat
  const dailyMaintBtc = hardwareCostBtc * (maintenanceAnnualPercent / 100) / 365
  const dailyMaintFiat = dailyMaintBtc * btcPriceInFiat

  const dailyProfitBtc = dailyRevenueBtc - dailyPowerCostBtc - dailyMaintBtc
  const dailyProfitFiat = dailyProfitBtc * btcPriceInFiat

  // Generator CapEx (production side, real from dataset) — summed across the genset stack
  const gensetCapexCad = gensets.reduce((sum, g) => {
    const spec = GENSET_DATA[g.gensetId]
    if (!spec) return sum
    return sum + spec.powerKW * spec.capexPerKW * Math.max(0, Math.floor(g.count || 0))
  }, 0)
  const gensetCapexBtc = gensetCapexCad / cadBtcPrice
  const gensetCapexFiat = gensetCapexBtc * btcPriceInFiat

  // Fixed setup costs (site prep, base generator, permitting, shipping, install) — do NOT scale linearly with every ASIC
  const fixedCostBtc = fixedSetupCostCad / cadBtcPrice
  const fixedCostFiat = fixedCostBtc * btcPriceInFiat
  const totalInvestmentBtc = hardwareCostBtc + fixedCostBtc + gensetCapexBtc
  const totalInvestmentFiat = hardwareCostFiat + fixedCostFiat + gensetCapexFiat

  // Payback now correctly uses TOTAL investment (fixed + variable + generator).
  const paybackDays = dailyProfitBtc > 0 ? totalInvestmentBtc / dailyProfitBtc : Infinity

  // Marginal payback (for one additional machine, ignoring fixed) — for transparency
  const marginalDailyProfitBtc = (adjustedHashrate * revenuePerThPerDayBtc * (1 - poolFeePercent / 100) * (uptimePercent / 100))
    - (adjustedPower / 1000 * 24 * powerCostUsdPerKwh / usdBtcPrice)
    - ((asic.cost_cad / cadBtcPrice) * (maintenanceAnnualPercent / 100) / 365)
  const marginalPayback = marginalDailyProfitBtc > 0 ? (asic.cost_cad / cadBtcPrice) / marginalDailyProfitBtc : Infinity

  // Methane loss opportunity cost (the daily profit you lose by venting instead of capturing)
  const maxPossibleDailyBtc = (generatorPowerKw * 1000 / asic.power_w) * asic.hashrate_ths * revenuePerThPerDayBtc * (1 - poolFeePercent / 100) * (uptimePercent / 100)
  const maxPossibleDailyProfitBtc = maxPossibleDailyBtc - (generatorPowerKw * 24 * powerCostUsdPerKwh / usdBtcPrice) - ((asic.cost_cad / cadBtcPrice) * (maintenanceAnnualPercent / 100) / 365) - (gensetCapexBtc / 365)
  const methaneLossDailyBtc = maxPossibleDailyBtc

  // Financing for CapEx (debt % at interest, simple annual cost)
  const debtAmount = totalInvestmentBtc * (debtPercent / 100)
  const annualFinancingCostBtc = debtAmount * (interestRate / 100) * 0.2 // approx 5yr amort factor
  const financedPaybackDays = (dailyProfitBtc - annualFinancingCostBtc) > 0 ? totalInvestmentBtc / (dailyProfitBtc - annualFinancingCostBtc) : Infinity

  void maxPossibleDailyProfitBtc

  return {
    effectiveDailyBtc: effectiveDailyBtc || 0,
    dailyRevenueBtc: dailyRevenueBtc || 0,
    dailyRevenueFiat: dailyRevenueFiat || 0,
    dailyPowerCostBtc: dailyPowerCostBtc || 0,
    dailyPowerCostFiat: dailyPowerCostFiat || 0,
    dailyMaintBtc: dailyMaintBtc || 0,
    dailyMaintFiat: dailyMaintFiat || 0,
    dailyProfitBtc: dailyProfitBtc || 0,
    dailyProfitFiat: dailyProfitFiat || 0,
    monthlyProfitBtc: (dailyProfitBtc * 30) || 0,
    monthlyProfitFiat: (dailyProfitFiat * 30) || 0,
    hardwareCostBtc: hardwareCostBtc || 0,
    hardwareCostFiat: hardwareCostFiat || 0,
    fixedCostBtc: fixedCostBtc || 0,
    fixedCostFiat: fixedCostFiat || 0,
    totalInvestmentBtc: totalInvestmentBtc || 0,
    totalInvestmentFiat: totalInvestmentFiat || 0,
    paybackDays,
    marginalPayback,
    totalPowerKw: totalPowerKw || 0,
    generatorPowerKw: generatorPowerKw || 0,
    gensetCapexBtc: gensetCapexBtc || 0,
    methaneLossDailyBtc: methaneLossDailyBtc || 0,
    financedPaybackDays,
    effectiveMachineCount: effectiveMachineCount || 0,
    gensetName,
    ceilingMiners: ceilingMiners || 0,
    usedPowerKw: effectivePowerKw || 0,
    hashpriceUsdPerThDay: revenuePerThPerDayBtc * usdBtcPrice,
  }
}
