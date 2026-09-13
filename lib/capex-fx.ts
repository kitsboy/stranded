/** Capex inflation + CAD/USD FX helpers. */

/**
 * Dated CAD↔USD fallback rates for STATIC/server heuristics that have no access
 * to the live multi-fiat BTC map (enrich-time portfolio potential, the mission
 * panel's genset capex, dashboard term-sheet). Derived from the fleet model's
 * documented map defaults so the app never contradicts itself: USD BTC default
 * = $85,000 and CAD BTC default = 115,000 (see lib/fleet-model.ts) ⇒
 * 1 USD = 115000/85000 CAD ≈ 1.3529 CAD, i.e. 1 CAD ≈ 0.7391 USD.
 * Live-rate surfaces (the fleet cockpit, SiteDetailsPanel) MUST use btcPrices,
 * never these. Date: 2026-09-13.
 */
export const CAD_PER_USD_FALLBACK = 115000 / 85000 // ≈ 1.3529 CAD per 1 USD
export const USD_PER_CAD_FALLBACK = 85000 / 115000 // ≈ 0.7391 USD per 1 CAD

/** Future value of capex after annual inflation for `years`. */
export function applyCapexInflation(
  capexCad: number,
  annualInflationPct: number,
  years: number,
): number {
  const base = Number.isFinite(capexCad) ? Math.max(0, capexCad) : 0
  const r = Number.isFinite(annualInflationPct) ? annualInflationPct / 100 : 0
  const y = Number.isFinite(years) ? Math.max(0, years) : 0
  return +(base * Math.pow(1 + r, y)).toFixed(2)
}

/** Convert CAD → USD. `usdCadRate` = USD per 1 CAD (e.g. 0.74). */
export function convertCadUsd(amountCad: number, usdCadRate: number): number {
  const a = Number.isFinite(amountCad) ? amountCad : 0
  const rate = Number.isFinite(usdCadRate) && usdCadRate > 0 ? usdCadRate : 0
  return +(a * rate).toFixed(2)
}

/** Convert USD → CAD. `usdCadRate` = USD per 1 CAD (e.g. 0.74) → CAD = USD / rate. */
export function convertUsdCad(amountUsd: number, usdCadRate: number): number {
  const a = Number.isFinite(amountUsd) ? amountUsd : 0
  const rate = Number.isFinite(usdCadRate) && usdCadRate > 0 ? usdCadRate : 0
  if (rate === 0) return 0
  return +(a / rate).toFixed(2)
}

/**
 * Inflate a USD capex figure, then express in both CAD and USD.
 * `usdCadRate` = USD per 1 CAD.
 */
export function scaleCapexWithFx(
  capexUsd: number,
  inflationPct: number,
  years: number,
  usdCadRate: number,
): { cad: number; usd: number } {
  const inflatedUsd = applyCapexInflation(capexUsd, inflationPct, years)
  const cad = convertUsdCad(inflatedUsd, usdCadRate)
  return { cad, usd: inflatedUsd }
}
