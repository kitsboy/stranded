/** Seeded Monte Carlo ROI shocks (BTC, uptime, gas) — deterministic, client-safe. */

export type MonteCarloOpts = {
  trials?: number
  /** BTC price vol as stdev of log-normal shock (default 0.35) */
  btcVol?: number
  /** Uptime vol (default 0.08) */
  uptimeVol?: number
  /** Gas volume / quality vol (default 0.15) */
  gasVol?: number
  seed?: number
  /** Include last N samples (default 50; 0 omits samples) */
  sampleLimit?: number
}

export type MonteCarloResult = {
  p10: number
  p50: number
  p90: number
  mean: number
  trials: number
  samples?: number[]
}

/** Mulberry32 — fast 32-bit seeded PRNG → [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normalish(rand: () => number): number {
  const u = Math.max(1e-9, rand())
  const v = Math.max(1e-9, rand())
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/**
 * Multiplicative Monte Carlo on daily CAD revenue.
 * Each trial: base * btcShock * uptimeShock * gasShock
 */
export function runMonteCarloRoi(
  baseDailyCad: number,
  opts: MonteCarloOpts = {},
): MonteCarloResult {
  const trials = Math.max(1, Math.floor(opts.trials ?? 500))
  const btcVol = opts.btcVol ?? 0.35
  const uptimeVol = opts.uptimeVol ?? 0.08
  const gasVol = opts.gasVol ?? 0.15
  const rand = mulberry32(opts.seed ?? 42)
  const base = Number.isFinite(baseDailyCad) ? Math.max(0, baseDailyCad) : 0
  const values: number[] = []

  for (let i = 0; i < trials; i++) {
    const btcShock = Math.exp(normalish(rand) * btcVol)
    const uptimeShock = Math.max(0.5, Math.min(1.05, 1 + normalish(rand) * uptimeVol))
    const gasShock = Math.max(0.4, 1 + normalish(rand) * gasVol)
    values.push(base * btcShock * uptimeShock * gasShock)
  }

  const sorted = values.slice().sort((a, b) => a - b)
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]
  const mean = values.reduce((s, v) => s + v, 0) / values.length

  const sampleLimit = opts.sampleLimit ?? 50
  const result: MonteCarloResult = {
    p10: Math.round(at(0.1)),
    p50: Math.round(at(0.5)),
    p90: Math.round(at(0.9)),
    mean: Math.round(mean),
    trials,
  }

  if (sampleLimit > 0) {
    result.samples = values.slice(-Math.min(sampleLimit, trials))
  }

  return result
}
