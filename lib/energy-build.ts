/**
 * Miner build for an official energy location.
 *
 * This is not the methane fleet. It does not invent a genset, a gas ceiling,
 * or a carbon credit. Power comes only from a number in the plant file or the
 * remote-community file, and a plant's average uses that province's published
 * generation divided by its published capacity. Missing numbers stay missing.
 */
import { CAD_PER_USD_FALLBACK } from '@/lib/capex-fx'
import { canonicalProvince, statcanRenewableTotal, type StatcanProvinceRow } from '@/lib/energy-atlas'
import {
  DEFAULT_POWER_COST_USD_PER_KWH,
  NETWORK_DERIVED_BTC_PER_TH_DAY,
  NETWORK_ESTIMATE_BTC_PER_TH_DAY,
} from '@/lib/fleet-model'
import { DEFAULT_FLEET_ASSUMPTIONS, type AsicSpec } from '@/lib/fleet-template'

/** Hours in 2025, the generation year on the Statistics Canada table. */
export const ENERGY_HOURS_PER_YEAR = 8760

/** NRCan plant file, Canada rows. Asserted against renewable-layers.json in tests. */
export const OFFICIAL_PLANT_COUNT = 1049
export const OFFICIAL_REMOTE_COUNT = 276
export const OFFICIAL_PLANT_COUNTS = {
  solar: 138,
  hydro: 555,
  wind: 241,
  biomass: 111,
  tidal: 1,
  pumped: 1,
  other: 2,
  geothermal: 0,
} as const
export const OFFICIAL_REMOTE_COUNTS = {
  'remote-fossil': 208,
  'remote-hydro': 35,
  'remote-grid': 26,
  'remote-unknown': 7,
} as const

const PLANT_CATS = new Set(['wind', 'solar', 'hydro', 'biomass', 'tidal', 'pumped', 'geothermal', 'other'])
const REMOTE_CATS = new Set(['remote-fossil', 'remote-hydro', 'remote-grid', 'remote-unknown'])
const CF_TECH: Record<string, 'hydro' | 'wind' | 'solar' | 'tidal'> = {
  hydro: 'hydro',
  wind: 'wind',
  solar: 'solar',
  tidal: 'tidal',
}

export type StatcanFile = {
  provinces?: Record<string, StatcanProvinceRow>
}

export type EnergyKind = 'plant' | 'remote' | 'other'

export type EnergyBasisId =
  | 'plant-cf'
  | 'plant-nameplate'
  | 'remote-average'
  | 'remote-renewable'
  | 'remote-fossil'
  | 'unavailable'

export type EnergyAssessment = {
  kind: EnergyKind
  buildable: boolean
  needsStatcan: boolean
  basisId: EnergyBasisId
  basis: string
  nameplateMw: number | null
  powerKw: number | null
  capacityFactor: number | null
  capacityFactorCapped: boolean
  provinceCapacityMw: number | null
  geothermalInProvinceMw: number
  fuelPrice: number | null
  fuelUnits: string
  /** Fuel is shown as a recorded fact. It is never a $/kWh input. */
  fuelUsedInRoi: false
  period: string
  province: string
  tech: string
}

export type EnergyBuildAsic = Pick<AsicSpec, 'hashrate_ths' | 'power_w' | 'cost_cad'>

export type EnergyScenario = {
  dailyRevenueBtc: number
  dailyRevenueUsd: number
  dailyPowerUsd: number
  dailyProfitBtc: number
  dailyProfitUsd: number
  paybackDays: number
  totalInvestmentUsd: number
}

export type EnergyBuildModel = {
  ceiling: number
  machineCount: number
  usedKw: number
  availableKw: number
  powerCostUsdPerKwh: number
  powerCostSubstituted: boolean
  hashpriceOptimistic: number
  hashpriceNetwork: number
  btcPriceUsd: number
  cadPerBtc: number
  fixedSetupCad: number
  hardwareCad: number
  gensetCapexCad: 0
  optimistic: EnergyScenario
  network: EnergyScenario
}

export type EnergyBuildInput = {
  powerKw: number
  asic: EnergyBuildAsic
  machineCount: number
  btcPriceUsd: number
  uptimePct?: number
  poolFeePct?: number
  maintenancePct?: number
  powerCostUsdPerKwh?: number
  fixedSetupCostCad?: number
  revenuePerThPerDayBtc?: number
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function text(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => (
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;'
  ))
}

function locationKind(props: Record<string, unknown>): EnergyKind {
  const kind = text(props.kind)
  const cat = text(props.cat)
  if (kind === 'plant' || PLANT_CATS.has(cat)) return 'plant'
  if (kind === 'remote' || REMOTE_CATS.has(cat)) return 'remote'
  return 'other'
}

function emptyAssessment(partial: Partial<EnergyAssessment> & Pick<EnergyAssessment, 'kind' | 'basis' | 'basisId'>): EnergyAssessment {
  return {
    buildable: false,
    needsStatcan: false,
    nameplateMw: null,
    powerKw: null,
    capacityFactor: null,
    capacityFactorCapped: false,
    provinceCapacityMw: null,
    geothermalInProvinceMw: 0,
    fuelPrice: null,
    fuelUnits: '',
    fuelUsedInRoi: false,
    period: '',
    province: '',
    tech: '',
    ...partial,
  }
}

function fuelFields(props: Record<string, unknown>): { fuelPrice: number | null; fuelUnits: string } {
  const raw = props.fuelPrice
  if (raw == null || text(raw) === '' || !Number.isFinite(Number(raw))) {
    return { fuelPrice: null, fuelUnits: '' }
  }
  return { fuelPrice: Number(raw), fuelUnits: text(props.fuelUnits) }
}

function plantTechReason(cat: string): string {
  if (cat === 'biomass') {
    return 'Statistics Canada publishes 2025 biomass generation and no 2024 biomass capacity, so a capacity factor is not invented and miners are not sized.'
  }
  if (cat === 'geothermal') {
    return 'The plant file has no geothermal plants of 1 MW or more. Where a province total includes geothermal megawatts, that figure is not this plant and is not a miner build.'
  }
  if (cat === 'pumped' || cat === 'other') {
    return 'Statistics Canada does not publish a capacity factor for this category, so miners are not sized.'
  }
  return 'This category has no published capacity factor, so miners are not sized.'
}

/**
 * How many kilowatts the file actually supports at this location.
 * `statcan` may be null while the table is still loading. A missing table
 * never becomes a guessed capacity factor.
 */
export function assessEnergyLocation(
  props: Record<string, unknown> | null | undefined,
  statcan?: StatcanFile | null,
): EnergyAssessment {
  const p = props || {}
  const kind = locationKind(p)
  const period = text(p.period || p.vintage)
  const provinceRaw = text(p.province)
  const fuel = fuelFields(p)

  if (kind === 'other') {
    const recorded = text(p.kind)
    const basis = recorded === 'water' || recorded === 'possible'
      ? 'This hydrokinetic assessment does not publish kilowatts for the polygon, so no miner build is sized.'
      : recorded === 'shade'
        ? 'A province total is not a plant pin, so no miner build is sized on the shade.'
        : 'This record is not a generation site, so no miner build is sized.'
    return emptyAssessment({ kind, basisId: 'unavailable', basis, period, province: provinceRaw, ...fuel })
  }

  if (kind === 'remote') {
    const fossilKw = num(p.fossilKw)
    const renewableKw = num(p.renewableKw)
    const annual = num(p.annualFossilMwh)
    const shared = { kind, period, province: provinceRaw, needsStatcan: false, ...fuel } as const
    if (annual > 0) {
      const averageKw = (annual * 1000) / ENERGY_HOURS_PER_YEAR
      const capped = fossilKw > 0 && averageKw > fossilKw
      const powerKw = capped ? fossilKw : averageKw
      return emptyAssessment({
        ...shared,
        buildable: powerKw > 0,
        basisId: 'remote-average',
        powerKw,
        basis: capped
          ? 'Average fossil generation in the 2018 file is above the recorded fossil capacity, so the build uses that capacity. This is recorded output, not spare power.'
          : 'Average fossil generation in the 2018 file, megawatt-hours per year divided by 8,760. It is capped by recorded fossil capacity when that figure is lower. This is recorded output, not spare power.',
      })
    }
    if (renewableKw > 0) {
      return emptyAssessment({
        ...shared,
        buildable: true,
        basisId: 'remote-renewable',
        powerKw: renewableKw,
        basis: 'Recorded renewable capacity in the 2018 file. Not a measured annual output, and not spare power.',
      })
    }
    if (fossilKw > 0) {
      return emptyAssessment({
        ...shared,
        buildable: true,
        basisId: 'remote-fossil',
        powerKw: fossilKw,
        basis: 'Recorded fossil capacity in the 2018 file. Annual generation was not stated, so this is nameplate, not measured output, and not spare power.',
      })
    }
    return emptyAssessment({
      ...shared,
      basisId: 'unavailable',
      basis: 'This community file does not record kilowatts or annual generation, so miners are not sized.',
    })
  }

  const cat = text(p.cat)
  const nameplateMw = num(p.mw)
  const tech = CF_TECH[cat] || ''
  const province = canonicalProvince(provinceRaw)
  const row = province && statcan?.provinces ? statcan.provinces[province] : undefined
  const provinceCapacityMw = row ? statcanRenewableTotal(row, 'cap') : null
  const geothermalInProvinceMw = Number(row?.capacityMW?.geothermal) || 0
  const sharedPlant = {
    kind,
    period,
    province: provinceRaw,
    tech: tech || cat,
    nameplateMw: nameplateMw > 0 ? nameplateMw : null,
    provinceCapacityMw,
    geothermalInProvinceMw,
    ...fuel,
  } as const

  if (!(nameplateMw > 0)) {
    return emptyAssessment({
      ...sharedPlant,
      basisId: 'unavailable',
      basis: 'The plant file does not record a nameplate above 0 MW, so miners are not sized.',
    })
  }
  if (!tech) {
    return emptyAssessment({
      ...sharedPlant,
      basisId: 'unavailable',
      basis: plantTechReason(cat),
    })
  }

  const needsStatcan = true
  if (!statcan?.provinces) {
    return emptyAssessment({
      ...sharedPlant,
      needsStatcan,
      basisId: 'unavailable',
      basis: 'The Statistics Canada table is not available here, so a capacity factor is not invented.',
    })
  }
  if (!row) {
    return emptyAssessment({
      ...sharedPlant,
      needsStatcan,
      basisId: 'unavailable',
      basis: 'This province is not in the Statistics Canada table, so a capacity factor is not invented.',
    })
  }

  const cap = Number(row.capacityMW?.[tech])
  const gen = row.generationMWh?.[tech]
  const genN = Number(gen)
  if (!(cap > 0) || !Number.isFinite(genN) || genN < 0 || gen == null) {
    const missingCap = !(cap > 0)
    return emptyAssessment({
      ...sharedPlant,
      needsStatcan,
      basisId: 'unavailable',
      basis: missingCap
        ? `Statistics Canada’s 2024 ${tech} capacity for ${province || provinceRaw} is missing or zero, so miners are not sized from a made-up capacity factor.`
        : `Statistics Canada’s 2025 table has no ${tech} generation for ${province || provinceRaw}, so miners are not sized.`,
    })
  }

  const rawCf = genN / (cap * ENERGY_HOURS_PER_YEAR)
  const capped = rawCf > 1
  const cf = capped ? 1 : rawCf
  const powerKw = nameplateMw * 1000 * cf
  const periodLabel = period || 'the plant file'
  const basis = capped
    ? `Nameplate ${nameplateMw} MW is the plant file (${periodLabel}). 2025 ${tech} generation in ${province} exceeded the 2024 capacity figure, so the build uses the nameplate, not a factor above 1. The factor is the province total, not a meter on this plant.`
    : `Nameplate ${nameplateMw} MW is the plant file (${periodLabel}). Average power uses ${province}’s 2025 ${tech} generation divided by its 2024 ${tech} capacity over 8,760 hours. The factor is the province total, not a meter on this plant.`
  return emptyAssessment({
    ...sharedPlant,
    buildable: powerKw > 0,
    needsStatcan,
    basisId: capped ? 'plant-nameplate' : 'plant-cf',
    basis,
    powerKw,
    capacityFactor: cf,
    capacityFactorCapped: capped,
  })
}

/** Floor of recorded watts divided by one ASIC's watts. */
export function energyMinerCeiling(powerKw: number, watts: number): number {
  if (!(powerKw > 0) || !(watts > 0)) return 0
  return Math.floor((powerKw * 1000) / watts)
}

function scenarioFor(
  asic: EnergyBuildAsic,
  count: number,
  rate: number,
  usd: number,
  cadPerBtc: number,
  uptime: number,
  pool: number,
  maint: number,
  power: number,
  fixedCad: number,
): EnergyScenario {
  const dailyBtc = asic.hashrate_ths * count * rate * (1 - pool / 100) * (uptime / 100)
  const dailyPowerUsd = (count * asic.power_w / 1000) * 24 * power
  const dailyPowerBtc = dailyPowerUsd / usd
  const hardwareBtc = (asic.cost_cad * count) / cadPerBtc
  const dailyMaintBtc = hardwareBtc * (maint / 100) / 365
  const fixedBtc = fixedCad / cadPerBtc
  const profitBtc = dailyBtc - dailyPowerBtc - dailyMaintBtc
  const investBtc = hardwareBtc + fixedBtc
  return {
    dailyRevenueBtc: dailyBtc,
    dailyRevenueUsd: dailyBtc * usd,
    dailyPowerUsd,
    dailyProfitBtc: profitBtc,
    dailyProfitUsd: profitBtc * usd,
    paybackDays: profitBtc > 0 ? investBtc / profitBtc : Infinity,
    totalInvestmentUsd: investBtc * usd,
  }
}

/**
 * Same rates as the methane fleet defaults, with the recorded kilowatts as the
 * ceiling and generator capex at zero. A non-positive power price is replaced
 * with the labelled 0.04 USD/kWh default. Zero is never used.
 */
export function computeEnergyBuild(input: EnergyBuildInput): EnergyBuildModel {
  const asic = input.asic
  const ceiling = energyMinerCeiling(input.powerKw, asic.power_w)
  const requested = Number.isFinite(input.machineCount) ? Math.max(0, Math.floor(input.machineCount)) : 0
  const machineCount = Math.min(requested, ceiling)
  const uptime = input.uptimePct ?? DEFAULT_FLEET_ASSUMPTIONS.uptimePct
  const pool = input.poolFeePct ?? DEFAULT_FLEET_ASSUMPTIONS.poolFeePct
  const maint = input.maintenancePct ?? DEFAULT_FLEET_ASSUMPTIONS.maintenancePct
  const fixedSetupCad = input.fixedSetupCostCad ?? DEFAULT_FLEET_ASSUMPTIONS.fixedSetupCostCad
  const requestedPower = input.powerCostUsdPerKwh ?? DEFAULT_POWER_COST_USD_PER_KWH
  const powerCostSubstituted = !(requestedPower > 0)
  const powerCostUsdPerKwh = powerCostSubstituted ? DEFAULT_POWER_COST_USD_PER_KWH : requestedPower
  const hashpriceOptimistic = input.revenuePerThPerDayBtc ?? NETWORK_ESTIMATE_BTC_PER_TH_DAY
  const btcPriceUsd = input.btcPriceUsd > 0 && Number.isFinite(input.btcPriceUsd)
    ? input.btcPriceUsd
    : DEFAULT_FLEET_ASSUMPTIONS.btcPriceUsd
  const cadPerBtc = btcPriceUsd * CAD_PER_USD_FALLBACK
  const args = [asic, machineCount, btcPriceUsd, cadPerBtc, uptime, pool, maint, powerCostUsdPerKwh, fixedSetupCad] as const
  return {
    ceiling,
    machineCount,
    usedKw: (machineCount * asic.power_w) / 1000,
    availableKw: input.powerKw,
    powerCostUsdPerKwh,
    powerCostSubstituted,
    hashpriceOptimistic,
    hashpriceNetwork: NETWORK_DERIVED_BTC_PER_TH_DAY,
    btcPriceUsd,
    cadPerBtc,
    fixedSetupCad,
    hardwareCad: asic.cost_cad * machineCount,
    gensetCapexCad: 0,
    optimistic: scenarioFor(args[0], args[1], hashpriceOptimistic, args[2], args[3], args[4], args[5], args[6], args[7], args[8]),
    network: scenarioFor(args[0], args[1], NETWORK_DERIVED_BTC_PER_TH_DAY, args[2], args[3], args[4], args[5], args[6], args[7], args[8]),
  }
}

/** Short hover card. The full build opens on click, in one panel. */
export function energyPinTeaserHtml(
  props: Record<string, unknown> | null | undefined,
  assessment: EnergyAssessment,
): string {
  const p = props || {}
  const name = escapeHtml(p.name || 'Unnamed')
  const mw = assessment.nameplateMw
  const power = assessment.powerKw
  let mid = 'Not a generation site'
  if (assessment.kind === 'remote') {
    mid = power && power > 0
      ? `Recorded power about ${Math.round(power).toLocaleString()} kW`
      : 'No recorded kilowatts to size miners'
  } else if (assessment.kind === 'plant') {
    const nameplate = mw && mw > 0
      ? `${mw.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW in the plant file`
      : 'Nameplate not stated'
    mid = power && power > 0
      ? `${nameplate} · about ${Math.round(power).toLocaleString()} kW average`
      : `${nameplate} · miners not sized`
  }
  const click = assessment.buildable ? 'Click to build it →' : 'Click for what the file records →'
  return (
    `<div class="text-xs font-semibold truncate max-w-[210px]">${name}</div>`
    + `<div class="text-micro text-gray-300 mt-0.5">${escapeHtml(mid)}</div>`
    + `<div class="text-micro text-gray-400 mt-0.5">${click}</div>`
  )
}
