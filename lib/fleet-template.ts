/**
 * Fleet templates — "what do we build at one location".
 *
 * A template is gensets × miners, never a bare miner counter: the miner count at
 * a site is bounded by the gas the installed gensets can convert
 * (`ceiling = floor(generatorPowerKw * 1000 / asicWatts)`). More gensets can
 * relieve an equipment bottleneck, but never multiply the site's fuel supply.
 *
 * Pure module: no React, no new dependencies. Unit-tested by scripts/test-helpers.mjs.
 * ASIC ids here are the canonical ones used by the map site panel
 * (components/SiteDetailsPanel.tsx imports ASIC_MACHINES from this file).
 */
import { GENSET_DATA, GensetId, computeGeneratorPower } from './sites'

/** Existing generator derate used across the app (computeGeneratorPower default). */
export const DEFAULT_GENSET_DERATE = 0.9

export type AsicSpec = {
  id: string
  name: string
  hashrate_ths: number
  power_w: number
  efficiency_j_th: number
  cost_cad: number
  manufacturer: string
}

/** Canonical ASIC list shared by the fleet model and the map site panel. */
export const ASIC_MACHINES: AsicSpec[] = [
  { id: 's21xp', name: 'Antminer S21 XP', hashrate_ths: 300, power_w: 4050, efficiency_j_th: 13.5, cost_cad: 8500, manufacturer: 'Bitmain' },
  { id: 's21', name: 'Antminer S21', hashrate_ths: 200, power_w: 3500, efficiency_j_th: 17.5, cost_cad: 5500, manufacturer: 'Bitmain' },
  { id: 's19kpro', name: 'Antminer S19k Pro', hashrate_ths: 136, power_w: 3264, efficiency_j_th: 24.0, cost_cad: 3200, manufacturer: 'Bitmain' },
  { id: 's19xp', name: 'Antminer S19 XP', hashrate_ths: 140, power_w: 3010, efficiency_j_th: 21.5, cost_cad: 3800, manufacturer: 'Bitmain' },
  { id: 'm50s', name: 'WhatsMiner M50S++', hashrate_ths: 150, power_w: 3276, efficiency_j_th: 21.8, cost_cad: 3600, manufacturer: 'MicroBT' },
  { id: 'm60s', name: 'WhatsMiner M60S', hashrate_ths: 186, power_w: 3348, efficiency_j_th: 18.0, cost_cad: 4800, manufacturer: 'MicroBT' },
  { id: 't21', name: 'Antminer T21', hashrate_ths: 190, power_w: 3610, efficiency_j_th: 19.0, cost_cad: 4200, manufacturer: 'Bitmain' },
  { id: 's19apro', name: 'Antminer S19a Pro', hashrate_ths: 110, power_w: 3250, efficiency_j_th: 29.5, cost_cad: 2400, manufacturer: 'Bitmain' },
  { id: 'm30s', name: 'WhatsMiner M30S++', hashrate_ths: 112, power_w: 3472, efficiency_j_th: 31.0, cost_cad: 2200, manufacturer: 'MicroBT' },
  { id: 's19', name: 'Antminer S19', hashrate_ths: 95, power_w: 3250, efficiency_j_th: 34.2, cost_cad: 1800, manufacturer: 'Bitmain' },
]

export type FleetGenset = { gensetId: GensetId; count: number }

export type FleetAssumptions = {
  btcPriceUsd: number
  revenuePerThPerDayBtc: number
  uptimePct: number
  powerCostUsdPerKwh: number
  poolFeePct: number
  maintenancePct: number
  fixedSetupCostCad: number
}

export type FleetMode = 'auto' | 'manual'

export type FleetTemplate = {
  id: string
  name: string
  /** keys present in the dataset, e.g. 'landfill_waste' */
  sourceTypes: string[]
  /** id from ASIC_MACHINES */
  asicId: string
  /** 0 = auto (fill to gas ceiling) */
  minerCount: number
  mode: FleetMode
  /** Optional for backwards-compatible saved/share builds. */
  overclockPercent?: number
  gensets: FleetGenset[]
  assumptions: FleetAssumptions
}

/** Minimal structural site shape — EnrichedSite satisfies it. */
export type FleetSite = {
  emission?: number
  properties?: {
    name?: string
    province?: string
    source_type?: string
    emission_rate_kg_day?: number
  }
}

export const DEFAULT_FLEET_ASSUMPTIONS: FleetAssumptions = {
  btcPriceUsd: 85000,
  revenuePerThPerDayBtc: 0.0000009,
  uptimePct: 95,
  powerCostUsdPerKwh: 0.04,
  poolFeePct: 1.5,
  maintenancePct: 5,
  fixedSetupCostCad: 25000,
}

/** Short, readable genset tokens for share links (`j316:2`). */
const GENSET_TOKENS: Record<GensetId, string> = {
  mobile250: 'm250',
  jenbacher316: 'j316',
  cat3520: 'c3520',
  man: 'man',
  cummins: 'cummins',
  microturbine: 'micro',
  wtsila: 'wtsila',
  futureSOFC: 'sofc',
}

const TOKEN_TO_GENSET: Record<string, GensetId> = Object.entries(GENSET_TOKENS).reduce(
  (acc, [id, token]) => ({ ...acc, [token]: id as GensetId, [id]: id as GensetId }),
  {} as Record<string, GensetId>,
)

export function gensetToken(gensetId: GensetId): string {
  return GENSET_TOKENS[gensetId] ?? String(gensetId)
}

export function gensetFromToken(token: string): GensetId | undefined {
  return TOKEN_TO_GENSET[(token || '').trim()]
}

export function asicById(id: string): AsicSpec | undefined {
  return ASIC_MACHINES.find(a => a.id === id)
}

export function asicWatts(id: string): number {
  const spec = asicById(id)
  return spec ? spec.power_w : ASIC_MACHINES[0].power_w
}

/**
 * Presets are keyed to `source_type` values that exist in
 * data/stranded-sites-REAL.geojson. The first entry is the primary key used for
 * suggestions; extra entries broaden matching.
 * Note: sewage/wastewater facilities carry `power_generation` in the dataset,
 * hence wastewater-small keys on it.
 */
export const MINER_STACK_PRESETS: FleetTemplate[] = [
  {
    id: 'landfill-basic',
    name: 'Landfill — Basic Capture',
    sourceTypes: ['landfill_waste'],
    asicId: 's21xp',
    minerCount: 0,
    mode: 'auto',
    gensets: [{ gensetId: 'jenbacher316', count: 1 }],
    assumptions: { ...DEFAULT_FLEET_ASSUMPTIONS },
  },
  {
    id: 'oilgas-modular',
    name: 'Oil & Gas — Modular Skid',
    sourceTypes: ['oil_gas_extraction'],
    asicId: 's21',
    minerCount: 0,
    mode: 'auto',
    gensets: [{ gensetId: 'cummins', count: 1 }],
    assumptions: { ...DEFAULT_FLEET_ASSUMPTIONS },
  },
  {
    id: 'wastewater-small',
    name: 'Wastewater / Small Distributed',
    sourceTypes: ['power_generation'],
    asicId: 's19kpro',
    minerCount: 0,
    mode: 'auto',
    gensets: [{ gensetId: 'mobile250', count: 1 }],
    assumptions: { ...DEFAULT_FLEET_ASSUMPTIONS },
  },
  {
    id: 'coalmine-large',
    name: 'Coal Mine — Large Capture',
    sourceTypes: ['coal_mining'],
    asicId: 's21xp',
    minerCount: 0,
    mode: 'auto',
    gensets: [{ gensetId: 'cat3520', count: 1 }],
    assumptions: { ...DEFAULT_FLEET_ASSUMPTIONS },
  },
  {
    id: 'pulp-power',
    name: 'Pulp & Power — Multi-Genset',
    sourceTypes: ['pulp_paper', 'power_generation'],
    asicId: 's21',
    minerCount: 0,
    mode: 'auto',
    gensets: [
      { gensetId: 'jenbacher316', count: 2 },
      { gensetId: 'mobile250', count: 1 },
    ],
    assumptions: { ...DEFAULT_FLEET_ASSUMPTIONS },
  },
]

export function fleetPresetById(id: string): FleetTemplate | undefined {
  return MINER_STACK_PRESETS.find(p => p.id === id)
}

/** Primary source_type match wins, then any listed source_type. */
export function fleetPresetForSourceType(sourceType: string): FleetTemplate | undefined {
  if (!sourceType) return undefined
  const key = sourceType.trim().toLowerCase()
  if (!key) return undefined
  const byPrimary = MINER_STACK_PRESETS.find(p => (p.sourceTypes[0] || '').toLowerCase() === key)
  return byPrimary || MINER_STACK_PRESETS.find(p => p.sourceTypes.some(t => t.toLowerCase() === key))
}

/**
 * The "typical" site a preset was authored for: the median-gas site of the same
 * source type. Used to rescale a template when it is applied to another location.
 */
export function referenceSiteForPreset(
  template: FleetTemplate,
  sites: FleetSite[],
): FleetSite | null {
  const sources = new Set((template.sourceTypes || []).map(t => t.toLowerCase()))
  if (!sources.size || !sites?.length) return null
  const matches = sites.filter(s => sources.has((s.properties?.source_type || '').toLowerCase()))
  if (!matches.length) return null
  const sorted = [...matches].sort((a, b) => siteEmissionKgDay(a) - siteEmissionKgDay(b))
  return sorted[Math.floor(sorted.length / 2)]
}

/** Site gas flow in kg CH₄/day, from either the enriched field or raw properties. */
export function siteEmissionKgDay(site: FleetSite | null | undefined): number {
  if (!site) return 0
  const direct = site.emission
  if (typeof direct === 'number' && isFinite(direct) && direct > 0) return direct
  const raw = site.properties?.emission_rate_kg_day
  return typeof raw === 'number' && isFinite(raw) && raw > 0 ? raw : 0
}

/**
 * One site, one fuel budget. Dispatch highest electrical kW per Nm³ first,
 * using powerKW / methaneNm3h (not the separate nominal eff field), then ID
 * for ties. Each unit is capped at rated power × derate. Continuous part-load
 * conversion is a screening assumption; no minimum-load/start-up losses here.
 * A finite demand dispatches only the fuel needed for that electrical load.
 */
export function dispatchSiteGas(
  site: FleetSite | null | undefined,
  gensets: FleetGenset[],
  derate = DEFAULT_GENSET_DERATE,
  demandKw = Infinity,
) {
  const availableKgPerDay = siteEmissionKgDay(site)
  const factor = Number.isFinite(derate) ? Math.max(0, Math.min(1, derate)) : 0
  const counts = new Map<GensetId, number>()
  for (const g of gensets || []) {
    if (!g || !GENSET_DATA[g.gensetId] || !Number.isFinite(g.count)) continue
    counts.set(g.gensetId, (counts.get(g.gensetId) || 0) + Math.max(0, Math.floor(g.count)))
  }
  const ordered = Array.from(counts.entries()).sort(([a], [b]) =>
    GENSET_DATA[b].powerKW / GENSET_DATA[b].methaneNm3h
    - GENSET_DATA[a].powerKW / GENSET_DATA[a].methaneNm3h || a.localeCompare(b))
  let remaining = availableKgPerDay
  let demand = demandKw === Infinity ? Infinity : Math.max(0, Number.isFinite(demandKw) ? demandKw : 0)
  let powerKw = 0
  let installedDeratedKw = 0
  const allocations = ordered.map(([gensetId, count]) => {
    const g = GENSET_DATA[gensetId]
    const capacityKw = g.powerKW * count * factor
    const kwPerKgDay = computeGeneratorPower(1, gensetId, factor)
    const suppliedKw = Math.min(capacityKw, remaining * kwPerKgDay, demand)
    const fuelKgPerDay = kwPerKgDay > 0 ? Math.min(remaining, suppliedKw / kwPerKgDay) : 0
    remaining = Math.max(0, remaining - fuelKgPerDay)
    demand = Math.max(0, demand - suppliedKw)
    powerKw += suppliedKw
    installedDeratedKw += capacityKw
    return { gensetId, count, capacityKw, powerKw: suppliedKw, fuelKgPerDay }
  })
  return { availableKgPerDay, powerKw, installedDeratedKw, consumedKgPerDay: availableKgPerDay - remaining, unconvertedKgPerDay: remaining, allocations }
}

/** Gas-supported electrical capacity, capped by the actual installed fleet. */
export function siteGasCeilingKw(
  site: FleetSite | null | undefined,
  gensets: FleetGenset[],
  derate: number = DEFAULT_GENSET_DERATE,
): number {
  return dispatchSiteGas(site, gensets, derate).powerKw
}

/** Preview and Apply keep the explicit inventory; no guessed median-site scaling. */
export function resolveFleetForSite(template: FleetTemplate, site: FleetSite): FleetTemplate {
  return capFleetToSite({ ...template, gensets: template.gensets.map(g => ({ ...g })) }, site)
}

/** The saved/share template carries its electrical operating point. */
export function fleetAsicWatts(template: FleetTemplate): number {
  const oc = Number.isFinite(template.overclockPercent) ? Math.max(0, Math.min(50, template.overclockPercent!)) : 0
  return asicWatts(template.asicId) * (1 + oc / 100) * (1 + oc / 200)
}

/** How many miners the ceiling can power. 0 when there is no gas. */
export function minerCeiling(ceilingKw: number, asicWatts: number): number {
  if (!(ceilingKw > 0) || !(asicWatts > 0)) return 0
  return Math.floor((ceilingKw * 1000) / asicWatts)
}

/** Clamp a template to a site: auto fills to the ceiling, manual never exceeds it. */
export function capFleetToSite(template: FleetTemplate, site: FleetSite): FleetTemplate {
  const ceiling = minerCeiling(
    siteGasCeilingKw(site, template.gensets),
    fleetAsicWatts(template),
  )
  const minerCount =
    template.mode === 'auto'
      ? ceiling
      : Math.max(0, Math.min(Math.floor(template.minerCount || 0), ceiling))
  return { ...template, minerCount }
}

/**
 * Keep the same genset mix shape, scaled to the target site's gas, so a template
 * authored at one location can be reused at another.
 */
export function rescaleToSite(
  template: FleetTemplate,
  fromSite: FleetSite,
  toSite: FleetSite,
): FleetTemplate {
  const fromGas = siteEmissionKgDay(fromSite)
  const toGas = siteEmissionKgDay(toSite)
  const ratio = fromGas > 0 && toGas > 0 ? toGas / fromGas : 1
  const gensets: FleetGenset[] = (template.gensets || []).map(g => ({
    gensetId: g.gensetId,
    count: g.count > 0 ? Math.max(1, Math.round(g.count * ratio)) : 0,
  }))
  const scaled: FleetTemplate = { ...template, gensets }
  const capped = capFleetToSite(scaled, toSite)
  if (capped.mode === 'auto') return capped

  const ceiling = minerCeiling(siteGasCeilingKw(toSite, gensets), fleetAsicWatts(template))
  const sourceCeiling = minerCeiling(siteGasCeilingKw(fromSite, template.gensets), fleetAsicWatts(template))
  const minerCount =
    sourceCeiling > 0
      ? Math.max(0, Math.min(ceiling, Math.round((template.minerCount || 0) * (ceiling / sourceCeiling))))
      : capped.minerCount
  return { ...capped, minerCount }
}

/** Invert computeGeneratorPower: kW → kg CH₄/day for one genset model.
 *  The ×24 mirrors the ÷24 in methaneNm3DayToKw — a day of energy at that
 *  average power. Omitting it (as this once did) breaks the round-trip by 576×. */
export function methaneKgPerDayForPower(kw: number, gensetId: GensetId, derate: number = DEFAULT_GENSET_DERATE): number {
  const g = GENSET_DATA[gensetId]
  if (!g || !(g.powerKW > 0) || !(derate > 0) || !(kw > 0)) return 0
  return (kw * 24 * 0.717 * g.methaneNm3h) / (g.powerKW * derate)
}

/** Distinguish spare installed conversion from gas not converted by this build.
 * Neither quantity proves venting: the site's existing gas treatment is unknown.
 */
export function unusedCapacity(site: FleetSite, template: FleetTemplate, usedPowerKw?: number) {
  const ceiling = dispatchSiteGas(site, template.gensets)
  const watts = fleetAsicWatts(template)
  const poweredMiners = Math.min(Math.max(0, Math.floor(template.minerCount || 0)), minerCeiling(ceiling.powerKw, watts))
  const used = dispatchSiteGas(site, template.gensets, DEFAULT_GENSET_DERATE, usedPowerKw ?? poweredMiners * watts / 1000)
  const unusedKgPerDay = Math.max(0, ceiling.consumedKgPerDay - used.consumedKgPerDay)
  return {
    unusedKw: Math.max(0, ceiling.powerKw - used.powerKw),
    unusedKgPerDay,
    unusedTPerYear: (unusedKgPerDay * 365) / 1000,
    consumedKgPerDay: used.consumedKgPerDay,
    unconvertedKgPerDay: used.unconvertedKgPerDay,
    capacityLimitedKgPerDay: ceiling.unconvertedKgPerDay,
  }
}

/** Readable share params — no base64: miners=468&asic=s21xp&gensets=j316:2&mode=auto&tpl=landfill-basic */
export function encodeFleet(template: FleetTemplate): string {
  const parts: string[] = []
  if (template.minerCount > 0 || template.mode === 'manual') parts.push(`miners=${Math.max(0, Math.floor(template.minerCount))}`)
  if (template.asicId) parts.push(`asic=${encodeURIComponent(template.asicId)}`)
  const gensets = (template.gensets || [])
    .filter(g => g && GENSET_DATA[g.gensetId] && Math.floor(g.count || 0) > 0)
    .map(g => `${gensetToken(g.gensetId)}:${Math.floor(g.count)}`)
  parts.push(`gensets=${gensets.join(',')}`)
  if (template.overclockPercent) parts.push(`oc=${template.overclockPercent}`)
  parts.push(`mode=${template.mode}`)
  if (template.id) parts.push(`tpl=${encodeURIComponent(template.id)}`)
  return parts.join('&')
}

function parseGensetParam(value: string | null): FleetGenset[] {
  if (!value) return []
  return value
    .split(',')
    .map(part => {
      const [token, countRaw] = part.split(':')
      const gensetId = gensetFromToken(token || '')
      if (!gensetId) return null
      const count = Math.floor(Number(countRaw))
      if (!isFinite(count) || count < 1) return null
      return { gensetId, count }
    })
    .filter((g): g is FleetGenset => g !== null)
}

/** Returns null when the params carry no fleet information at all. */
export function decodeFleet(params: URLSearchParams): FleetTemplate | null {
  const tpl = params.get('tpl')
  const miners = params.get('miners')
  const asic = params.get('asic')
  const gensetsRaw = params.get('gensets')
  const modeRaw = params.get('mode')
  if (!tpl && !miners && !asic && !gensetsRaw && !modeRaw) return null

  const preset = tpl ? fleetPresetById(tpl) : undefined
  const base: FleetTemplate = preset
    ? { ...preset, gensets: preset.gensets.map(g => ({ ...g })), assumptions: { ...preset.assumptions } }
    : {
        id: tpl || 'custom',
        name: 'Custom fleet',
        sourceTypes: [],
        asicId: ASIC_MACHINES[0].id,
        minerCount: 0,
        mode: 'auto',
        gensets: [{ gensetId: 'jenbacher316', count: 1 }],
        assumptions: { ...DEFAULT_FLEET_ASSUMPTIONS },
      }

  const parsedGensets = parseGensetParam(gensetsRaw)
  const mode: FleetMode =
    modeRaw === 'auto' || modeRaw === 'manual'
      ? modeRaw
      : miners != null
        ? 'manual'
        : base.mode

  const minerCount =
    miners != null && isFinite(Number(miners))
      ? Math.max(0, Math.floor(Number(miners)))
      : mode === 'auto'
        ? 0
        : base.minerCount

  return {
    ...base,
    id: tpl || base.id,
    name: preset ? preset.name : base.name,
    asicId: asic && asicById(asic) ? asic : base.asicId,
    gensets: gensetsRaw === '' ? [] : parsedGensets.length ? parsedGensets : base.gensets.map(g => ({ ...g })),
    mode,
    minerCount,
    ...(params.has('oc') && Number.isFinite(Number(params.get('oc'))) ? { overclockPercent: Math.max(0, Math.min(50, Number(params.get('oc')))) } : {}),
    assumptions: { ...base.assumptions },
  }
}

// ---------------------------------------------------------------------------
// Named fleet templates — local-first persistence (no backend).
// The site is a static export: every read/write is guarded so a bad/stale key
// can never white-screen the page.
// ---------------------------------------------------------------------------

export type NamedFleetRecord = {
  id: string
  name: string
  savedAt: string
  template: FleetTemplate
}

export const NAMED_FLEET_STORAGE_KEY = 'stranded.fleets.v1'

function validTemplateShape(v: unknown): v is FleetTemplate {
  if (!v || typeof v !== 'object') return false
  const t = v as FleetTemplate
  if (typeof t.id !== 'string' || typeof t.name !== 'string') return false
  if (!Array.isArray(t.sourceTypes) || !Array.isArray(t.gensets)) return false
  if (typeof t.asicId !== 'string' || typeof t.minerCount !== 'number') return false
  if (t.mode !== 'auto' && t.mode !== 'manual') return false
  if (!t.assumptions || typeof t.assumptions.btcPriceUsd !== 'number') return false
  // gensets must each be a small {gensetId, count} pair
  for (const g of t.gensets) {
    if (!g || typeof g !== 'object') return false
    const gg = g as FleetGenset
    if (typeof gg.gensetId !== 'string' || typeof gg.count !== 'number') return false
    if (!(gg.gensetId in GENSET_DATA)) return false
  }
  return true
}

function readNamedFleetsRaw(): NamedFleetRecord[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(NAMED_FLEET_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is NamedFleetRecord =>
        !!r && typeof r === 'object' && typeof r.id === 'string'
        && typeof r.name === 'string' && typeof r.savedAt === 'string'
        && validTemplateShape((r as NamedFleetRecord).template),
    )
  } catch {
    return []
  }
}

function writeNamedFleets(list: NamedFleetRecord[]) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(NAMED_FLEET_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // quota / privacy mode — a failed save must never throw into the UI
  }
}

/** Save a copy of the template under a human name. Returns the new record. */
export function saveNamedFleet(name: string, template: FleetTemplate): NamedFleetRecord | null {
  const trimmed = (name || '').trim()
  if (!trimmed || !validTemplateShape(template)) return null
  if (typeof localStorage === 'undefined') return null
  const record: NamedFleetRecord = {
    id: `nf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    savedAt: new Date().toISOString(),
    template: {
      ...template,
      gensets: template.gensets.map(g => ({ ...g })),
      assumptions: { ...template.assumptions },
    },
  }
  const list = readNamedFleetsRaw()
  list.push(record)
  writeNamedFleets(list)
  return record
}

export function listNamedFleets(): NamedFleetRecord[] {
  return readNamedFleetsRaw()
}

export function deleteNamedFleet(id: string): boolean {
  const list = readNamedFleetsRaw()
  const next = list.filter(r => r.id !== id)
  if (next.length === list.length) return false
  writeNamedFleets(next)
  return true
}

// ---------------------------------------------------------------------------
// Fleet export block — one additive section used by the export generators.
// The generators fall back to their existing output when no fleet is present.
// ---------------------------------------------------------------------------

export type FleetExportBlock = {
  template: FleetTemplate
  /** The site the fleet is sized for — used for gas ceiling / vented figures. */
  site?: FleetSite
  /** Override payback (days). Falls back to a model estimate from assumptions. */
  paybackDays?: number | null
}

/** Genset inventory label for the export block, e.g. "2 × INNIO Jenbacher J316". */
function fleetGensetLabel(gensets: FleetGenset[]): string {
  const parts = (gensets || [])
    .filter(g => GENSET_DATA[g.gensetId] && Math.floor(g.count || 0) > 0)
    .map(g => `${Math.floor(g.count)} × ${GENSET_DATA[g.gensetId].name}`)
  return parts.length ? parts.join(' + ') : '—'
}

/**
 * Payback for the fleet export block.
 *
 * The ONLY source of truth for payback is the live session model. When the caller
 * does not pass the session's payback (`paybackDays` undefined/null), we do NOT
 * reconstruct one from the template's stored assumptions (they may be stale and
 * diverge from the on-screen model) — we report "unavailable" instead (contract
 * 4.3: templates = equipment + overclock only; all financials come from the session).
 */
export function estimateFleetPaybackDays(f: FleetExportBlock): number | null {
  if (f.paybackDays === undefined) return null
  return f.paybackDays !== null && isFinite(f.paybackDays) ? f.paybackDays : null
}

/** Structured numbers for the fleet block (shared by md/html/json generators). */
export function fleetBlockData(f: FleetExportBlock) {
  const t = f.template
  const asic = asicById(t.asicId)
  const minerCount = Math.max(0, Math.floor(t.minerCount || 0))
  const asicW = fleetAsicWatts(t)
  const totalPowerKw = (minerCount * asicW) / 1000
  const gasCeilingKw = siteGasCeilingKw(f.site, t.gensets)
  const ceilingMiners = minerCeiling(gasCeilingKw, asicW)
  const unused = unusedCapacity(f.site || {}, t)
  const unconvertedKgPerDay = unused.unconvertedKgPerDay
  const capturedKgPerDay = unused.consumedKgPerDay
  const capturedPct = f.site && siteEmissionKgDay(f.site) > 0
    ? Math.min(100, (capturedKgPerDay / siteEmissionKgDay(f.site)) * 100)
    : 0
  return {
    name: t.name || 'Custom fleet',
    mode: t.mode,
    asicName: asic ? asic.name : t.asicId,
    asicId: t.asicId,
    minerCount,
    poweredMinerCount: Math.min(minerCount, ceilingMiners),
    unsupportedMinerCount: Math.max(0, minerCount - ceilingMiners),
    usedPowerKw: Math.min(minerCount, ceilingMiners) * asicW / 1000,
    totalPowerKw,
    gasCeilingKw,
    ceilingMiners,
    gensetLabel: fleetGensetLabel(t.gensets),
    // Legacy keys retained as unknown, never mislabel unconverted gas as vented.
    ventedKgPerDay: null,
    ventedTPerYear: null,
    unconvertedKgPerDay,
    unusedConversionKgPerDay: unused.unusedKgPerDay,
    capacityLimitedKgPerDay: unused.capacityLimitedKgPerDay,
    capturedKgPerDay,
    capturedPct,
    paybackDays: estimateFleetPaybackDays(f),
  }
}

export function fleetBlockMarkdown(f: FleetExportBlock): string {
  const d = fleetBlockData(f)
  return [
    `**Fleet template: ${d.name}**`,
    `- Mode: **${d.mode === 'auto' ? 'Fill the gas' : 'My build'}** · ASIC: ${d.asicName} · Miners: ${d.minerCount.toLocaleString()}`,
    `- Gensets: ${d.gensetLabel}`,
    `- Powered miners: ${d.poweredMinerCount.toLocaleString()} · unsupported installed miners: ${d.unsupportedMinerCount.toLocaleString()} (earn nothing)`,
    `- Miner load: **${d.totalPowerKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW** of ${d.gasCeilingKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW gas ceiling (${d.ceilingMiners.toLocaleString()} miners max)`,
    `- Methane: **${d.capturedKgPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/day captured (${d.capturedPct.toFixed(0)}%)** · ${d.unconvertedKgPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/day not converted (existing treatment unknown)`,
    d.paybackDays != null
      ? `- Payback (model): **${Math.round(d.paybackDays).toLocaleString()} days**`
      : '- Payback: **unavailable** (uses the live session model; no explicit value passed)',
    `- Financials: **uses the current session's assumptions** (this template stores equipment + overclock only).`,
  ].filter(Boolean).join('\n')
}

export function fleetBlockHtml(f: FleetExportBlock): string {
  const d = fleetBlockData(f)
  const row = (label: string, value: string) =>
    `<tr><td style="padding:2px 8px 2px 0;color:#64748b">${label}</td><td style="padding:2px 0"><strong>${value}</strong></td></tr>`
  return `<h3 style="color:#FF8C00;margin:16px 0 4px">Fleet template — ${escapeHtmlStr(d.name)}</h3>
  <table style="border-collapse:collapse;font-size:12px;margin:4px 0">
    <tbody>
      ${row('Mode', d.mode === 'auto' ? 'Fill the gas' : 'My build')}
      ${row('ASIC', escapeHtmlStr(d.asicName))}
      ${row('Miners installed / powered', `${d.minerCount.toLocaleString()} / ${d.poweredMinerCount.toLocaleString()}`)}
      ${row('Unsupported (earn nothing)', d.unsupportedMinerCount.toLocaleString())}
      ${row('Gensets', escapeHtmlStr(d.gensetLabel))}
      ${row('Miner load', `${d.totalPowerKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW of ${d.gasCeilingKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW ceiling`)}
      ${row('Methane captured', `${d.capturedKgPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/day (${d.capturedPct.toFixed(0)}%)`)}
      ${row('Not converted (treatment unknown)', `${d.unconvertedKgPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/day`)}
      ${d.paybackDays != null ? row('Payback (model)', `${Math.round(d.paybackDays).toLocaleString()} days`) : ''}
    </tbody>
  </table>`
}

function escapeHtmlStr(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
