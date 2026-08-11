/** Carbon / methane → CO₂e value helpers (pure, client-safe). */

/** Convert CH₄ tonnes/year to CO₂e tonnes using GWP (default AR5 = 28). */
export function methaneToCo2eTonnes(ch4TonnesYear: number, gwp = 28): number {
  const ch4 = Number.isFinite(ch4TonnesYear) ? Math.max(0, ch4TonnesYear) : 0
  const g = Number.isFinite(gwp) && gwp > 0 ? gwp : 28
  return ch4 * g
}

/** Carbon value in USD for a CO₂e mass. */
export function carbonValueUsd(co2eTonnes: number, pricePerTonne: number): number {
  return Math.round(Math.max(0, co2eTonnes) * Math.max(0, pricePerTonne))
}

/**
 * Annual avoided-methane value from daily CH₄ kg emission.
 * Returns USD number (also usable via object fields if expanded later).
 * kg/day → tonnes/year = kg/day * 365 / 1000
 */
export function avoidedMethaneValue(
  emissionKgDay: number,
  carbonPrice: number,
  gwp = 28,
): number {
  const kg = Number.isFinite(emissionKgDay) ? Math.max(0, emissionKgDay) : 0
  const ch4TonnesYear = (kg * 365) / 1000
  const co2e = methaneToCo2eTonnes(ch4TonnesYear, gwp)
  return carbonValueUsd(co2e, carbonPrice)
}
