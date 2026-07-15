import { StrandedSite } from '@/types/site'
import {
  computeStrandedScore, scoreTierClass, scoreTierColor, scoreTier,
  effectiveGridKm, effectiveInternetFactor, hasMeasuredGrid, hasStrongConnectivity,
} from './scoring'
import { scorePercentile, scoreBadgeLabel } from './percentile'

export type EnrichedSite = StrandedSite & {
  id: string
  strandedScore: number
  scorePercentile?: number
  scoreBadge?: string
  potentialDailyProfitCAD: number // rough optimistic
  emission: number
  recommendedGenset?: keyof typeof GENSET_DATA
  maxGeneratorPowerKW?: number
}

export {
  computeStrandedScore, scorePercentile, scoreBadgeLabel, scoreTierClass, scoreTierColor, scoreTier,
  effectiveGridKm, effectiveInternetFactor, hasMeasuredGrid, hasStrongConnectivity,
}

export function enrichSite(site: StrandedSite): EnrichedSite {
  const p = site.properties
  const emission = p.emission_rate_kg_day || 0
  const score = computeStrandedScore(site)

  // Very rough optimistic daily profit potential using average machine assumptions
  const roughDailyBtc = (emission / 22000) * 0.0008 // tuned heuristic from real emission -> usable methane energy
  const potentialDailyProfitCAD = Math.round(roughDailyBtc * 85000 * 1.35 * 0.82) // after power/opex

  // Deterministic fallback — never random (breaks bookmarks/mission across reloads)
  const ghgrp = p.ghgrp_id || p.id || (() => {
    const [lng, lat] = site.geometry?.coordinates || [0, 0]
    const key = `${p.name || 'site'}|${p.province || ''}|${lng.toFixed(5)},${lat.toFixed(5)}`
    let h = 0
    for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0
    return `site-${(h >>> 0).toString(36)}`
  })()

  return {
    ...site,
    id: ghgrp,
    strandedScore: score,
    potentialDailyProfitCAD,
    emission,
    recommendedGenset: recommendGenset(emission),
    maxGeneratorPowerKW: Math.round(computeGeneratorPower(emission)),
  }
}

export async function loadSites(): Promise<EnrichedSite[]> {
  let data: GeoJSON.FeatureCollection
  try {
    const res = await fetch('/data/stranded-sites.geojson')
    if (!res.ok) throw new Error('fetch failed')
    data = await res.json()
    if (typeof window !== 'undefined') {
      const { setCachedGeojson } = await import('./offline-db')
      await setCachedGeojson(data)
    }
  } catch {
    if (typeof window !== 'undefined') {
      const { getCachedGeojson } = await import('./offline-db')
      const cached = await getCachedGeojson()
      if (!cached?.features?.length) throw new Error('No site data available')
      data = cached
    } else {
      throw new Error('No site data available')
    }
  }
  const features: StrandedSite[] = (data.features || []) as StrandedSite[]
  const enriched = features.map(enrichSite)
  const allScores = enriched.map(s => s.strandedScore)
  return enriched.map(s => ({
    ...s,
    scorePercentile: scorePercentile(s.strandedScore, allScores),
    scoreBadge: scoreBadgeLabel(scorePercentile(s.strandedScore, allScores)),
  }))
}

export function getProvinces(sites: EnrichedSite[]) {
  return Array.from(new Set(sites.map(s => s.properties.province).filter(Boolean))).sort()
}

// Shared real-world genset data for methane-to-power (approx 2026 biogas/stranded methane rated, from education page)
export const GENSET_DATA = {
  mobile250: { name: "Mobile 250 kW Biogas Unit", powerKW: 250, eff: 0.33, methaneNm3h: 85, capexPerKW: 1800, notes: "Fast deploy, H2S tolerant" },
  jenbacher316: { name: "INNIO Jenbacher J316 GS-B.L", powerKW: 850, eff: 0.405, methaneNm3h: 220, capexPerKW: 1050, notes: "High efficiency, gold standard" },
  cat3520: { name: "Caterpillar G3520H", powerKW: 2000, eff: 0.42, methaneNm3h: 480, capexPerKW: 920, notes: "High power density, rugged" },
  man: { name: "MAN 20V35/44G", powerKW: 10500, eff: 0.47, methaneNm3h: 2300, capexPerKW: 780, notes: "Large scale, highest efficiency" },
  cummins: { name: "Cummins QSK60G", powerKW: 1500, eff: 0.39, methaneNm3h: 390, capexPerKW: 1100, notes: "Balanced cost/performance" },
  microturbine: { name: "Capstone C200 Microturbine", powerKW: 200, eff: 0.33, methaneNm3h: 55, capexPerKW: 2100, notes: "Ultra-low maintenance" },
  wtsila: { name: "Wärtsilä 20V34SG", powerKW: 9500, eff: 0.46, methaneNm3h: 2100, capexPerKW: 750, notes: "High efficiency large scale" },
  futureSOFC: { name: "Solid Oxide Fuel Cell (2028+)", powerKW: 500, eff: 0.60, methaneNm3h: 90, capexPerKW: 3500, notes: "Future high-eff, low emission" },
} as const

export type GensetId = keyof typeof GENSET_DATA

// Compute generator power from daily methane kg using genset
export function computeGeneratorPower(dailyMethaneKg: number, gensetId: GensetId = 'jenbacher316', derate = 0.9): number {
  const g = GENSET_DATA[gensetId]
  const dailyM3 = dailyMethaneKg / 0.717 // approx kg CH4 to Nm3
  return (dailyM3 / g.methaneNm3h) * g.powerKW * derate
}

// Recommend genset based on emission (larger for bigger sites)
export function recommendGenset(emissionKgDay: number): GensetId {
  if (emissionKgDay > 20000) return 'man'
  if (emissionKgDay > 10000) return 'cat3520'
  if (emissionKgDay > 5000) return 'jenbacher316'
  return 'mobile250'
}

// Compute full per-site Value including generator CapEx + mining (simplified from panel)
export function computeSiteValue(site: EnrichedSite, gensetId: GensetId = 'jenbacher316', asicHashrate = 200, asicPowerW = 3500, asicCost = 5500, liveBtc = 85000, uptime = 0.95, powerPriceUsdKwh = 0.04) {
  const emission = site.emission || 0
  const powerKW = computeGeneratorPower(emission, gensetId)
  const numAsics = Math.max(1, Math.floor(powerKW * 1000 / asicPowerW))
  const dailyBtc = numAsics * asicHashrate * 0.0000009 * (liveBtc / 85000) // adjusted
  const gensetCapex = GENSET_DATA[gensetId].powerKW * GENSET_DATA[gensetId].capexPerKW
  const miningCapex = numAsics * asicCost
  const totalCapex = gensetCapex + miningCapex
  const dailyOpexCad = (powerKW * powerPriceUsdKwh * 24 * 1.35) // power + maint
  const dailyProfitCad = (dailyBtc * liveBtc) - dailyOpexCad
  const annualProfit = dailyProfitCad * 365 * uptime
  const paybackDays = annualProfit > 0 ? totalCapex / (dailyProfitCad * uptime) : Infinity
  const methaneLossDailyBtc = dailyBtc // opportunity cost of venting
  return {
    powerKW: Math.round(powerKW),
    numAsics,
    dailyBtc: +dailyBtc.toFixed(4),
    totalCapex: Math.round(totalCapex),
    paybackDays: isFinite(paybackDays) ? Math.round(paybackDays) : Infinity,
    methaneLossDailyBtc: +methaneLossDailyBtc.toFixed(4),
    gensetName: GENSET_DATA[gensetId].name,
  }
}

export function filterSites(
  sites: EnrichedSite[],
  opts: {
    minEmission?: number
    maxEmission?: number
    provinces?: Set<string>
    sourceTypes?: Set<string>
    minScore?: number
  }
) {
  return sites.filter(s => {
    const p = s.properties
    const em = s.emission
    if (opts.minEmission != null && em < opts.minEmission) return false
    if (opts.maxEmission != null && em > opts.maxEmission) return false
    if (opts.provinces?.size && !opts.provinces.has(p.province)) return false
    if (opts.sourceTypes?.size && !opts.sourceTypes.has(p.source_type)) return false
    if (opts.minScore != null && s.strandedScore < opts.minScore) return false
    return true
  })
}
