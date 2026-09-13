/**
 * Site-cockpit presentation helpers.
 *
 * Everything the cockpit *shows* around the model lives here: the block scale for
 * the miner stack, the two-segment capacity bar, the sats/day formatting, the
 * recency / flux badges and the venting-vs-your-build comparison. Pure functions,
 * no React, no dependencies — unit-tested by scripts/test-helpers.mjs so the
 * on-screen labels can be asserted against the model and the exports.
 */
import { methaneToCo2eTonnes } from './carbon-overlay'
import {
  ASIC_MACHINES,
  minerCeiling,
  siteGasCeilingKw,
  DEFAULT_GENSET_DERATE,
  type FleetGenset,
  type FleetSite,
} from './fleet-template'
import { NETWORK_ESTIMATE_BTC_PER_TH_DAY } from './fleet-model'

/** GWP100 used across the app (AR5, matches lib/carbon-overlay defaults). */
export const METHANE_GWP100 = 28

// ---------------------------------------------------------------------------
// Miner stack: block scale
// ---------------------------------------------------------------------------

/** Never draw more than this many blocks — the scale grows instead. */
export const MAX_STACK_BLOCKS = 60

const BLOCK_TIERS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000]

/** Miners represented by one block for a given count — always a round number. */
export function minersPerBlock(count: number): number {
  const n = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0))
  if (n <= 0) return 1
  const needed = Math.ceil(n / MAX_STACK_BLOCKS)
  return BLOCK_TIERS.find(t => t >= needed) ?? Math.ceil(needed / 1000) * 1000
}

/**
 * Block layout for the filled segment. `partial` is the size (0-1) of the last,
 * partly-filled block so the bar is always exactly to scale.
 */
export function minerBlocks(count: number): { perBlock: number; blocks: number; partial: number } {
  const n = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0))
  const perBlock = minersPerBlock(n)
  const blocks = Math.floor(n / perBlock)
  const remainder = n - blocks * perBlock
  return { perBlock, blocks, partial: remainder > 0 ? remainder / perBlock : 0 }
}

/** Always-true legend for whichever scale is in use. */
export function blockScaleLabel(count: number): string {
  const { perBlock } = minerBlocks(count)
  return perBlock === 1 ? '1 block = 1 miner' : `1 block = ${perBlock.toLocaleString()} miners`
}

// ---------------------------------------------------------------------------
// Capacity bar
// ---------------------------------------------------------------------------

export type CapacityModel = {
  /** Miners actually counted by the model (clamped to the gas ceiling). */
  miners: number
  ceilingMiners: number
  /** 0-100, min 0 max 100 — the bar can never exceed the gas ceiling. */
  filledPct: number
  sparePct: number
  /** kW the miners draw, clamped to the gas ceiling. */
  usedKw: number
  gasCeilingKw: number
  atCeiling: boolean
  /** Miners the installed gas could still feed but this build does not buy. */
  spareMiners: number
  filledBlocks: number
  partialBlock: number
  spareBlocks: number
  perBlock: number
}

export function capacityModel(input: {
  count: number
  ceilingMiners: number
  gasCeilingKw: number
  asicWatts: number
}): CapacityModel {
  const ceiling = Math.max(0, Math.floor(input.ceilingMiners || 0))
  const raw = Math.max(0, Math.floor(Number.isFinite(input.count) ? input.count : 0))
  const miners = Math.min(raw, ceiling)
  const filledPct = ceiling > 0 ? Math.min(100, (miners / ceiling) * 100) : 0
  const sparePct = Math.max(0, 100 - filledPct)
  const spareMiners = Math.max(0, ceiling - miners)
  const asicWatts = input.asicWatts > 0 ? input.asicWatts : 0
  const usedKw = (miners * asicWatts) / 1000
  const filled = minerBlocks(miners)
  // Spare gas is drawn in whole blocks of the *same* scale so the two segments stay comparable.
  const spareBlocks = filled.perBlock > 0 ? Math.floor(spareMiners / filled.perBlock) : 0
  return {
    miners,
    ceilingMiners: ceiling,
    filledPct,
    sparePct,
    usedKw,
    gasCeilingKw: input.gasCeilingKw,
    atCeiling: ceiling > 0 && miners >= ceiling,
    spareMiners,
    filledBlocks: filled.blocks,
    partialBlock: filled.partial,
    spareBlocks,
    perBlock: filled.perBlock,
  }
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

export function satsPerDay(dailyBtc: number): number {
  const btc = Number.isFinite(dailyBtc) ? Math.max(0, dailyBtc) : 0
  return Math.round(btc * 1e8)
}

/** Format an already-sats value (sats/day, sats on the table) with thousands separators. */
export function formatSats(sats: number): string {
  return Math.round(Number.isFinite(sats) ? Math.max(0, sats) : 0).toLocaleString()
}

export function formatCount(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function formatKw(kw: number): string {
  return formatCount(Math.max(0, kw || 0), kw < 100 ? 1 : 0)
}

export function formatMoneyShort(value: number, symbol = '$'): string {
  const v = Number.isFinite(value) ? value : 0
  const sign = v < 0 ? '-' : ''
  const abs = Math.abs(v)
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e4) return `${sign}${symbol}${(abs / 1e3).toFixed(1)}K`
  if (abs >= 1e3) return `${sign}${symbol}${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  return `${sign}${symbol}${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function formatPayback(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return 'N/A'
  if (days < 730) return `${Math.round(days).toLocaleString()} d`
  return `${(days / 365).toFixed(1)} yr`
}

/**
 * The panel's headline fiat format — `$1.23` / `$1.2K` / `$1.23M`.
 *
 * ONE implementation for every surface that quotes the same model number: the
 * ROI summary's rows, the wallet/build figures and the build summary strip. Two
 * formatters over one value is how a "summary" ends up disagreeing with the
 * export it is summarising, so the strip deliberately quotes the exact string
 * the ROI summary shows. Output is byte-identical to the panel's original
 * inline `fmt` (including its `$0.00` fallback for non-finite input) — this is a
 * de-duplication, not a format change. Non-finite input is the caller's signal
 * to show an explicit "N/A" instead (see buildSummaryState).
 */
export function formatMoneyFiat(value: number, symbol = '$'): string {
  if (!isFinite(value) || isNaN(value)) return symbol + '0.00'
  if (value >= 1e6) return symbol + (value / 1e6).toFixed(2) + 'M'
  if (value >= 1e3) return symbol + (value / 1e3).toFixed(1) + 'K'
  return symbol + value.toFixed(2)
}

// ---------------------------------------------------------------------------
// Build summary strip — the persistent "what am I building" readout
// ---------------------------------------------------------------------------

export type BuildSummaryTone = 'neutral' | 'ok' | 'warn'

export type BuildSummaryState = {
  /** The site's gas cannot power a single miner. */
  noGas: boolean
  /** Installed miners beyond what the gas ceiling can power — they earn nothing. */
  unsupportedMiners: number
  /** Miners the installed generation could still power but this build does not buy. */
  spareMiners: number
  /** 0-100 fill of the gas ceiling (0 when there is no gas). */
  powerPct: number
  /** False when the model has no finite net (e.g. nothing installed). */
  netAvailable: boolean
  /** False when payback is Infinity/0 — shown as "N/A", never as a fake number. */
  paybackAvailable: boolean
  note: string
  tone: BuildSummaryTone
}

/**
 * Presentation state for the build summary strip. Pure: it reads the SAME
 * `computeFleetModel` outputs the cockpit, the ROI summary and the exports use
 * and adds no arithmetic of its own beyond clamping. Never derives a second
 * "net" — the number shown is the model's own net (revenue − power −
 * maintenance).
 */
export function buildSummaryState(input: {
  /** Miners the user has chosen (may exceed what the gas supports). */
  installedMiners: number
  /** Miners the model actually powers (clamped to the gas ceiling). */
  poweredMiners: number
  ceilingMiners: number
  usedKw: number
  availableKw: number
  paybackDays: number
  netPerDayFiat: number
}): BuildSummaryState {
  const ceiling = Math.max(0, Math.floor(Number.isFinite(input.ceilingMiners) ? input.ceilingMiners : 0))
  const installed = Math.max(0, Math.floor(Number.isFinite(input.installedMiners) ? input.installedMiners : 0))
  const powered = Math.max(0, Math.min(Math.floor(Number.isFinite(input.poweredMiners) ? input.poweredMiners : 0), ceiling))
  const usedKw = Math.max(0, Number.isFinite(input.usedKw) ? input.usedKw : 0)
  const availableKw = Math.max(0, Number.isFinite(input.availableKw) ? input.availableKw : 0)
  const noGas = ceiling <= 0
  const unsupportedMiners = Math.max(0, installed - ceiling)
  const spareMiners = Math.max(0, ceiling - powered)
  const powerPct = availableKw > 0 ? Math.max(0, Math.min(100, (usedKw / availableKw) * 100)) : 0
  const netAvailable = Number.isFinite(input.netPerDayFiat)
  const paybackAvailable = Number.isFinite(input.paybackDays) && input.paybackDays > 0

  let note = ''
  let tone: BuildSummaryTone = 'neutral'
  // Keep every note short enough to read on ONE line at 360px: a second line of
  // prose costs ~16px of the sticky strip, which is the sheet's content space.
  if (noGas) {
    tone = 'warn'
    note = 'No usable gas here — the build stays at zero.'
  } else if (unsupportedMiners > 0) {
    tone = 'warn'
    note = `${unsupportedMiners.toLocaleString()} miners beyond the gas ceiling earn nothing.`
  } else if (spareMiners > 0) {
    note = `Spare generation could power ${spareMiners.toLocaleString()} more miners.`
  } else {
    tone = 'ok'
    note = 'Gas ceiling reached — equipment adds no gas.'
  }

  return { noGas, unsupportedMiners, spareMiners, powerPct, netAvailable, paybackAvailable, note, tone }
}

// ---------------------------------------------------------------------------
// Venting baseline vs your build — the emotional core, two numbers
// ---------------------------------------------------------------------------

export type VentingComparison = {
  /** Additional $/day this build earns versus venting the same gas (today's case is $0). */
  extraUsdPerDay: number
  /** Tonnes of CO₂e kept out of the atmosphere per year by capturing it. */
  co2eAvoidedTonnesPerYear: number
  /** Methane still venting because this build is smaller than the gas available. */
  ventedKgPerDay: number
  ventedTPerYear: number
  /** Fraction of the site's gas this build captures, 0-1. */
  capturedFraction: number
}

export function ventingComparison(input: {
  siteEmissionKgDay: number
  capturedKgPerDay: number
  dailyProfitFiat: number
  unusedKgPerDay?: number
  gwp?: number
}): VentingComparison {
  const emission = Math.max(0, input.siteEmissionKgDay || 0)
  const captured = Math.max(0, Math.min(input.capturedKgPerDay || 0, emission))
  const ventedKgPerDay = Math.max(0, input.unusedKgPerDay ?? Math.max(0, emission - captured))
  const gwp = input.gwp && input.gwp > 0 ? input.gwp : METHANE_GWP100
  const co2eAvoidedTonnesPerYear = methaneToCo2eTonnes((captured * 365) / 1000, gwp)
  return {
    extraUsdPerDay: Number.isFinite(input.dailyProfitFiat) ? input.dailyProfitFiat : 0,
    co2eAvoidedTonnesPerYear,
    ventedKgPerDay,
    ventedTPerYear: (ventedKgPerDay * 365) / 1000,
    capturedFraction: emission > 0 ? Math.min(1, captured / emission) : 0,
  }
}

// ---------------------------------------------------------------------------
// Honesty visuals — data recency, flux, hashprice
// ---------------------------------------------------------------------------

export type DataRecencyBadge = {
  label: string
  detail: string
  tier: 'high' | 'medium' | 'low'
  /** True when the facility has not filed since 2022 — its figures are historic, not current. */
  stale: boolean
  /** The year the figures come from (last_reported_year, falling back to reference_year). */
  year: number | null
}

const SOURCE_LABEL: Record<string, string> = {
  'ECCC-GHGRP': 'ECCC',
  'ECCC GHGRP': 'ECCC',
  ECCC: 'ECCC',
}

/** The newest GHGRP reporting year we treat as "current". Older = stale. */
export const CURRENT_REPORTING_YEAR = 2023

/**
 * "ECCC 2024 · high confidence" — or, for an old filing, "ECCC 2011 · stale filing · high confidence".
 * Rendered only when the dataset actually carries the fields; a site with none of them shows no badge.
 */
export function dataRecencyBadge(props: Record<string, unknown> | null | undefined): DataRecencyBadge | null {
  if (!props) return null
  const rawSource = typeof props.data_source === 'string' ? props.data_source : ''
  const source = SOURCE_LABEL[rawSource] || rawSource
  const rawYear = props.last_reported_year ?? props.reference_year
  const year = Number(rawYear)
  const yearOk = Number.isFinite(year) && year > 1990 && year < 2100
  const confidence = typeof props.confidence === 'string' ? props.confidence.toLowerCase() : ''
  const confOk = ['high', 'medium', 'low'].includes(confidence)
  if (!source && !yearOk && !confOk) return null
  const stale = yearOk && year < CURRENT_REPORTING_YEAR
  const label = [source, yearOk ? String(year) : null].filter(Boolean).join(' ')
  const confDetail = confOk ? `${confidence} confidence` : 'confidence not stated'
  return {
    label: label || 'Source data',
    detail: stale ? `stale filing · ${confDetail}` : confDetail,
    tier: stale ? 'low' : confOk ? (confidence as DataRecencyBadge['tier']) : 'medium',
    stale,
    year: yearOk ? year : null,
  }
}

export type FluxBadge = { label: string; tone: 'flare' | 'vent' }

/**
 * Flux state from the ECCC "Emissions by Source" breakdown. Returns null when the
 * dataset does not say — including `flux_scope: 'not-applicable'`, where ECCC
 * publishes no venting/flaring split at all (landfill gas is reported as "Waste").
 * Never render "not reported" as "does not flare".
 */
export function fluxBadge(props: Record<string, unknown> | null | undefined): FluxBadge | null {
  if (!props) return null
  if (props.flux_scope === 'not-applicable') return null
  const raw = [props.flux_status, props.flare_status, props.emission_status, props.venting_status]
    .find(v => typeof v === 'string' && v.trim()) as string | undefined
  if (!raw) return null
  const key = raw.toLowerCase()
  if (key === 'flaring') return { label: 'Currently flaring', tone: 'flare' }
  if (key === 'both') return { label: 'Flaring + venting', tone: 'flare' }
  if (key === 'venting') return { label: 'Venting', tone: 'vent' }
  if (key === 'none' || key === 'not_reported' || key === 'unknown' || key === 'n/a') return null
  // Tolerate free-text values from older exports.
  if (key.includes('flare') || key.includes('combust')) return { label: 'Currently flaring', tone: 'flare' }
  if (key.includes('vent') || key.includes('release')) return { label: 'Venting', tone: 'vent' }
  return { label: raw, tone: 'vent' }
}

export type HashpriceRead = {
  usedUsdPerThDay: number
  networkUsdPerThDay: number
  /** null when the two are within 1% — nothing worth telling the user. */
  aboveNetwork: boolean | null
  /** $/TH/day the miners must beat to cover power alone at the assumed cost. */
  breakEvenUsdPerThDay: number
}

export function hashpriceRead(input: {
  usedBtcPerThDay: number
  usdBtcPrice: number
  networkBtcPerThDay: number
  asicHashrateThs: number
  asicWatts: number
  powerCostUsdPerKwh: number
}): HashpriceRead {
  const usdBtc = input.usdBtcPrice > 0 ? input.usdBtcPrice : 0
  const used = Math.max(0, input.usedBtcPerThDay || 0) * usdBtc
  const network = Math.max(0, input.networkBtcPerThDay || 0) * usdBtc
  const diff = network > 0 ? (used - network) / network : 0
  const kwhPerThDay = input.asicHashrateThs > 0
    ? ((input.asicWatts / 1000) * 24) / input.asicHashrateThs
    : 0
  return {
    usedUsdPerThDay: used,
    networkUsdPerThDay: network,
    aboveNetwork: Math.abs(diff) < 0.01 ? null : diff > 0,
    breakEvenUsdPerThDay: kwhPerThDay * (input.powerCostUsdPerKwh > 0 ? input.powerCostUsdPerKwh : 0),
  }
}

// ---------------------------------------------------------------------------
// Map hover teaser — teach before the click
// ---------------------------------------------------------------------------

/** The genset a site's gas is assumed to be served by when nothing is chosen yet. */
export const HOVER_DEFAULT_GENSETS: FleetGenset[] = [{ gensetId: 'jenbacher316', count: 1 }]

export type HoverTeaser = {
  /** Miners the site's gas could power with the default genset. */
  miners: number
  ceilingKw: number
  satsPerDay: number
  usdPerDay: number
}

/**
 * The one-line teaser on a pin hover: "Gas supports up to 468 miners ≈ $1,234/day".
 * Uses exactly the helpers and rates the site cockpit uses, so hovering and
 * clicking can never quote two different numbers.
 */
export function hoverTeaser(
  site: FleetSite | null | undefined,
  btcUsd: number,
  gensets: FleetGenset[] = HOVER_DEFAULT_GENSETS,
  derate: number = DEFAULT_GENSET_DERATE,
): HoverTeaser {
  const asic = ASIC_MACHINES[0]
  const ceilingKw = siteGasCeilingKw(site, gensets, derate)
  const miners = minerCeiling(ceilingKw, asic.power_w)
  // Same base model as the cockpit, at its shipped defaults.
  const dailyBtc = asic.hashrate_ths * miners * NETWORK_ESTIMATE_BTC_PER_TH_DAY * (1 - 0.015) * 0.95
  const price = btcUsd > 0 ? btcUsd : 85000
  return { miners, ceilingKw, satsPerDay: satsPerDay(dailyBtc), usdPerDay: dailyBtc * price }
}

// ---------------------------------------------------------------------------
// Share / handoff link — the fleet link that travels inside the application
// ---------------------------------------------------------------------------

/**
 * Keeps `/map?site=…&miners=…&gensets=…` in one place so the cockpit's
 * "Send this build" and the copy-link button always quote the same build.
 */
export function buildFleetPath(siteId: string, query: string): string {
  const base = `/map?site=${encodeURIComponent(siteId || '')}`
  const extra = (query || '').replace(/^&+/, '')
  return extra ? `${base}&${extra}` : base
}
