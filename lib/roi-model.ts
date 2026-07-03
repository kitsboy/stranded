import { EnrichedSite, GensetId, GENSET_DATA, computeGeneratorPower } from './sites'

export type RoiParams = {
  liveBtcUsd: number
  historicalBtcUsd?: number
  difficultyMultiplier?: number
  txFeeBtcPerDay?: number
  gasTreatmentDerate?: number
  h2sDerate?: number
  seasonalUptimeFactor?: number
  carbonCreditUsdPerTonne?: number
  fleetDeclineAnnualPct?: number
  years?: number
}

const SOURCE_H2S_DERATE: Record<string, number> = {
  landfill: 0.92, 'oil and gas': 0.88, agriculture: 0.95, wastewater: 0.9,
  mining: 0.85, other: 0.93,
}

const PROVINCE_SEASONAL: Record<string, number> = {
  Alberta: 0.94, Ontario: 0.96, 'British Columbia': 0.95, Saskatchewan: 0.93,
  Manitoba: 0.92, Quebec: 0.94, 'Nova Scotia': 0.91, 'New Brunswick': 0.91,
  'Newfoundland and Labrador': 0.9, 'Northwest Territories': 0.88,
  Nunavut: 0.85, Yukon: 0.87, 'Prince Edward Island': 0.92,
}

const PROVINCE_INCENTIVES: Record<string, { federal: number; provincial: number }> = {
  Alberta: { federal: 0.15, provincial: 0.12 },
  Ontario: { federal: 0.15, provincial: 0.18 },
  'British Columbia': { federal: 0.15, provincial: 0.14 },
  Saskatchewan: { federal: 0.15, provincial: 0.1 },
  Quebec: { federal: 0.15, provincial: 0.16 },
  Manitoba: { federal: 0.15, provincial: 0.11 },
}

export function getH2sDerate(sourceType: string): number {
  const key = Object.keys(SOURCE_H2S_DERATE).find(k => sourceType.toLowerCase().includes(k))
  return SOURCE_H2S_DERATE[key || 'other'] ?? 0.93
}

export function getSeasonalUptime(province: string): number {
  return PROVINCE_SEASONAL[province] ?? 0.93
}

export function computeLcoeUsdPerKwh(capexUsd: number, powerKw: number, opexUsdPerYear: number, years = 15): number {
  const annualKwh = powerKw * 8760
  const totalKwh = annualKwh * years
  const totalCost = capexUsd + opexUsdPerYear * years
  return totalCost / totalKwh
}

export function computeJobsEstimate(powerKw: number, numAsics: number) {
  const installFte = Math.max(2, Math.ceil(powerKw / 2000))
  const opsFte = Math.max(1, Math.ceil(numAsics / 500))
  return { installFte, opsFte, total: installFte + opsFte }
}

export function computeAdvancedRoi(
  site: EnrichedSite,
  gensetId: GensetId = 'jenbacher316',
  params: RoiParams = { liveBtcUsd: 85000 }
) {
  const p = site.properties
  const btc = params.historicalBtcUsd ?? params.liveBtcUsd
  const difficulty = params.difficultyMultiplier ?? 1.0
  const txFees = params.txFeeBtcPerDay ?? 0.0002
  const treatmentDerate = params.gasTreatmentDerate ?? 1.0
  const h2s = params.h2sDerate ?? getH2sDerate(p.source_type || '')
  const seasonal = params.seasonalUptimeFactor ?? getSeasonalUptime(p.province || '')
  const carbonPrice = params.carbonCreditUsdPerTonne ?? 45
  const decline = params.fleetDeclineAnnualPct ?? 8
  const years = params.years ?? 5

  const emission = site.emission || 0
  const derate = treatmentDerate * h2s * seasonal
  const powerKW = computeGeneratorPower(emission, gensetId, derate)
  const g = GENSET_DATA[gensetId]
  const numAsics = Math.max(1, Math.floor(powerKW * 1000 / 3500))
  const hashrate = 200

  let annualBtc = 0
  let annualRevenue = 0
  for (let y = 0; y < years; y++) {
    const declineFactor = Math.pow(1 - decline / 100, y)
    const dailyBtc = numAsics * hashrate * 0.0000009 * (btc / 85000) * difficulty * declineFactor + txFees
    annualBtc += dailyBtc * 365 * seasonal
    annualRevenue += dailyBtc * 365 * seasonal * btc
  }

  const gensetCapex = g.powerKW * g.capexPerKW
  const miningCapex = numAsics * 5500
  const totalCapex = gensetCapex + miningCapex
  const annualOpex = powerKW * 0.04 * 24 * 365 * 1.35
  const ch4Tonnes = (p.ch4_tonnes_year || emission * 365 * 0.001)
  const carbonRevenue = ch4Tonnes * 28 * carbonPrice * 0.3

  const incentives = PROVINCE_INCENTIVES[p.province || ''] ?? { federal: 0.1, provincial: 0.08 }
  const incentiveGrant = totalCapex * (incentives.federal + incentives.provincial)

  const lcoe = computeLcoeUsdPerKwh(gensetCapex, powerKW, annualOpex)
  const jobs = computeJobsEstimate(powerKW, numAsics)
  const netAnnual = (annualRevenue / years) + carbonRevenue - annualOpex
  const paybackYears = netAnnual > 0 ? (totalCapex - incentiveGrant) / netAnnual : Infinity

  return {
    powerKW: Math.round(powerKW),
    numAsics,
    lcoeUsdPerKwh: +lcoe.toFixed(4),
    annualBtc: +annualBtc.toFixed(4),
    annualRevenueUsd: Math.round(annualRevenue / years),
    carbonRevenueUsd: Math.round(carbonRevenue),
    incentiveGrantUsd: Math.round(incentiveGrant),
    paybackYears: isFinite(paybackYears) ? +paybackYears.toFixed(1) : Infinity,
    jobs,
    derateApplied: +derate.toFixed(3),
    gensetName: g.name,
  }
}

export const USED_ASIC_MARKET = [
  { id: 's19-used', name: 'Antminer S19 (Refurb)', hashrate: 95, powerW: 3250, costCad: 1200, condition: 'Good', warranty: '90 days' },
  { id: 's19jpro-used', name: 'Antminer S19j Pro (Used)', hashrate: 104, powerW: 3068, costCad: 1800, condition: 'Fair', warranty: '60 days' },
  { id: 'm30s-used', name: 'WhatsMiner M30S (Refurb)', hashrate: 88, powerW: 3344, costCad: 1100, condition: 'Good', warranty: '90 days' },
  { id: 's19xp-used', name: 'Antminer S19 XP (Off-lease)', hashrate: 140, powerW: 3010, costCad: 2800, condition: 'Excellent', warranty: '6 months' },
  { id: 's21-used', name: 'Antminer S21 (Demo unit)', hashrate: 200, powerW: 3500, costCad: 4200, condition: 'Like new', warranty: '1 year' },
]