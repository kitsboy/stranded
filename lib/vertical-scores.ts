/** Vertical opportunity scores (mining / heat / hydrogen / abatement). */

export type VerticalScores = {
  mining: number
  heat: number
  hydrogen: number
  abatement: number
}

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.toLowerCase() : v != null ? String(v).toLowerCase() : ''
}

export type VerticalScoreInput = {
  source_type?: string
  confidence?: string
  emission_rate_kg_day?: number
  province?: string
  [key: string]: unknown
}

/**
 * Compute 0–100 scores per energy vertical from site props + emission + stranded score.
 * - mining ≈ stranded score
 * - heat: urban / wastewater / agriculture source proxies
 * - hydrogen: large emission + oil/gas preferred
 * - abatement: emission volume × confidence
 */
export function computeVerticalScores(
  props: VerticalScoreInput,
  emission: number,
  strandedScore: number,
): VerticalScores {
  const em = Number.isFinite(emission) ? Math.max(0, emission) : num(props.emission_rate_kg_day)
  const score = Number.isFinite(strandedScore) ? strandedScore : 0
  const src = str(props.source_type)
  const conf = str(props.confidence)

  const mining = clamp100(score)

  // Heat: wastewater, landfill (urban digesters), agriculture, pulp — closer to heat loads
  let heat = 25
  if (src.includes('wastewater') || src.includes('sewage')) heat = 88
  else if (src.includes('agriculture') || src.includes('farm') || src.includes('manure')) heat = 78
  else if (src.includes('landfill') || src.includes('waste')) heat = 72
  else if (src.includes('pulp') || src.includes('paper') || src.includes('refinery')) heat = 65
  else if (src.includes('oil') || src.includes('gas')) heat = 40
  // slight bump for mid/high emission (more genset heat)
  if (em >= 5000) heat += 6
  else if (em >= 1000) heat += 3

  // Hydrogen: prefers large oil/gas methane streams
  let hydrogen = 20
  if (src.includes('oil') || src.includes('gas') || src.includes('upstream') || src.includes('flare')) {
    hydrogen = 55
  }
  // emission scale (log-ish): 500 → ~10, 5000 → ~25, 50000 → ~40
  const emBoost = Math.min(40, Math.log10(Math.max(em, 1) + 1) * 12)
  hydrogen += emBoost
  if (em >= 10000 && (src.includes('oil') || src.includes('gas'))) hydrogen += 10

  // Abatement: volume × confidence weight
  const confW = conf === 'high' ? 1 : conf === 'medium' ? 0.75 : conf === 'low' ? 0.45 : 0.6
  // 0 kg → 0; 20k kg/day high conf → ~100
  const volScore = Math.min(100, (Math.log10(Math.max(em, 1) + 1) / Math.log10(20001)) * 100)
  const abatement = clamp100(volScore * confW)

  return {
    mining,
    heat: clamp100(heat),
    hydrogen: clamp100(hydrogen),
    abatement,
  }
}
