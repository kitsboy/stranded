/**
 * Canonical Stranded Score™ logic (v3).
 * Used by lib/scoring.ts, generate-live-stats.js, and validate-data.js — keep in sync.
 */

const INTERNET_FACTOR = {
  fiber: 1.35, starlink: 1.15, lte: 1.0, cable: 1.05, none: 0.7,
}

const CONFIDENCE_FACTOR = {
  high: 1.25, medium: 1.0, low: 0.75,
}

/** Typical grid tie-in distance by source when ECCC has no distance field */
const SOURCE_GRID_KM = {
  landfill_waste: 12,
  refinery: 8,
  gas_processing: 10,
  power_generation: 6,
  oil_gas_extraction: 28,
  oil_sands: 35,
  coal_mining: 22,
  industrial_other: 18,
  pipeline_transmission: 20,
  pulp_paper: 14,
  oil_gas_support: 25,
}

/** Province infrastructure multiplier (higher = better connectivity / access) */
const PROVINCE_INFRA = {
  Alberta: 1.08,
  Ontario: 1.1,
  'British Columbia': 1.06,
  Quebec: 1.04,
  Saskatchewan: 1.02,
  Manitoba: 0.98,
  'Nova Scotia': 0.94,
  'New Brunswick': 0.93,
  'Newfoundland and Labrador': 0.9,
  'Prince Edward Island': 0.88,
  'Northwest Territories': 0.82,
  Yukon: 0.8,
  Nunavut: 0.75,
}

/** Deployment ease by industrial source */
const SOURCE_DEPLOY = {
  landfill_waste: 1.12,
  refinery: 1.1,
  gas_processing: 1.08,
  power_generation: 1.15,
  oil_gas_extraction: 1.0,
  oil_sands: 0.92,
  coal_mining: 0.95,
  industrial_other: 1.02,
  pipeline_transmission: 0.98,
  pulp_paper: 1.05,
  oil_gas_support: 0.96,
}

function resolveGridDistanceKm(props) {
  if (props.distance_to_grid_km != null) return props.distance_to_grid_km
  let km = SOURCE_GRID_KM[props.source_type] ?? 22
  const emission = props.emission_rate_kg_day || 0
  if (emission > 20000) km *= 0.55
  else if (emission > 5000) km *= 0.72
  else if (emission > 1000) km *= 0.88
  km = km / (PROVINCE_INFRA[props.province] ?? 1)
  return Math.max(3, Math.min(80, km))
}

function resolveInternetFactor(props) {
  if (props.internet_type) {
    return INTERNET_FACTOR[(props.internet_type || '').toLowerCase()] || 0.95
  }
  const emission = props.emission_rate_kg_day || 0
  const provInfra = PROVINCE_INFRA[props.province] ?? 1
  if (provInfra >= 1.05 && emission > 2000) return 1.15
  if (emission > 8000) return 1.1
  if (provInfra >= 1.0) return 1.05
  return 0.95
}

/** v3: proxies missing grid/internet from source type, province, and emission tier */
function computeStrandedScore(props) {
  const emission = props.emission_rate_kg_day || 0
  const dist = resolveGridDistanceKm(props)
  const internet = resolveInternetFactor(props)
  const conf = (props.confidence || 'medium').toLowerCase()

  const emissionScore = (Math.log10(Math.max(emission, 10)) / Math.log10(60000)) * 44
  const proximityScore = Math.min(22, Math.max(4, 24 - dist * 0.26))
  const infraScore = internet * 9
  const confScore = (CONFIDENCE_FACTOR[conf] || 1) * 7
  const deploy = SOURCE_DEPLOY[props.source_type] ?? 1
  const sourceBonus = 4 + (deploy - 1) * 10
  const yr = props.reference_year || 2020
  const recency = yr >= 2023 ? 3 : yr >= 2021 ? 1.5 : 0

  const raw = emissionScore + proximityScore + infraScore + confScore + sourceBonus + recency
  return Math.max(22, Math.min(96, Math.round(raw * 10) / 10))
}

module.exports = {
  computeStrandedScore,
  resolveGridDistanceKm,
  resolveInternetFactor,
  INTERNET_FACTOR,
  CONFIDENCE_FACTOR,
}