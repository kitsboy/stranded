/** Catalog of user-facing methodology formulas. */

export type FormulaEntry = {
  title: string
  formula: string
  notes: string
}

export const FORMULAS: Record<string, FormulaEntry> = {
  score: {
    title: 'Stranded Score™ v3',
    formula:
      'score = clamp(0..100, emission + proximity + source + confidence + recency + connectivity)',
    notes:
      'Factor points from lib/scoring-shared.cjs. Grid distance may be measured or inferred; inferred factors are flagged in explain output.',
  },
  'emission-kw': {
    title: 'Emission → generator kW',
    formula: 'powerKW ≈ emission_kg_day × methaneEnergyFactor × gensetEfficiency / loadFactor',
    notes:
      'Rough rule of thumb used in UI: kW ≈ emission_kg_day / 10 for Jenbacher-class sizing before derates (H₂S, seasonal, treatment).',
  },
  'emission->kw': {
    title: 'Emission → generator kW',
    formula: 'powerKW ≈ emission_kg_day × methaneEnergyFactor × gensetEfficiency / loadFactor',
    notes:
      'Alias of emission-kw. Rough rule of thumb: kW ≈ emission_kg_day / 10 before derates.',
  },
  'daily-btc': {
    title: 'Daily BTC (fleet)',
    formula: 'dailyBtc ≈ numAsics × hashrateTh × hashpriceProxy(btc, difficulty) + txFees',
    notes:
      'Hashprice proxy scales with live BTC and difficulty multiplier; seasonal uptime and gas derates reduce effective power and ASIC count.',
  },
  'daily btc': {
    title: 'Daily BTC (fleet)',
    formula: 'dailyBtc ≈ numAsics × hashrateTh × hashpriceProxy(btc, difficulty) + txFees',
    notes: 'Alias of daily-btc.',
  },
  payback: {
    title: 'Simple payback',
    formula: 'paybackYears = (capex − incentives) / (annualRevenue + carbon − opex)',
    notes:
      'Infinite when net annual ≤ 0. Does not include tax depreciation or residual salvage.',
  },
  co2e: {
    title: 'Methane → CO₂e',
    formula: 'co2e_tonnes = ch4_tonnes × GWP  (default GWP = 28)',
    notes:
      'CH₄ tonnes/year ≈ emission_kg_day × 365 / 1000. Carbon value = co2e × price_per_tonne.',
  },
}

/** Lookup formula by id; undefined if unknown. */
export function getFormula(id: string): FormulaEntry | undefined {
  return FORMULAS[id]
}
