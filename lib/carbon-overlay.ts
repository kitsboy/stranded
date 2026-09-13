/** Carbon / methane → CO₂e value helpers (pure, client-safe). */

/** AR5 100-year global warming potential for methane — the app-wide constant. */
export const METHANE_GWP100 = 28

/**
 * Whether the dataset establishes a vent/flare baseline for a facility, i.e. a
 * published fugitive split (flux_scope "fugitive") with at least one numeric
 * vent/flare share. Landfill gas is filed under "Waste" with
 * flux_scope "not-applicable" and no split — such sites have NO baseline, so
 * no carbon-credit or abatement revenue may be shown (contract 3.2).
 *
 * NOTE: a published split alone does NOT establish credit eligibility,
 * additionality or saleable revenue — it only means the baseline exists. See
 * carbonBaselineLabel() for the honesty wording.
 */
export function hasCarbonBaseline(props: Record<string, unknown> | null | undefined): boolean {
  if (!props) return false
  if (props.flux_scope === 'not-applicable') return false
  const split = [props.ch4_vented_kg_day, props.ch4_flared_kg_day, props.flare_share_pct]
  return split.some(v => typeof v === 'number' && Number.isFinite(v) && v > 0)
}

/** Honest one-line status for carbon surfaces. Never implies eligibility. */
export function carbonBaselineLabel(props: Record<string, unknown> | null | undefined): string {
  return hasCarbonBaseline(props)
    ? 'vent/flare split published — credit eligibility not established (screening only)'
    : 'no published baseline — credits not established'
}

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
