/** Capex inflation + CAD/USD FX helpers. */

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
