/**
 * Methane → electrical power — the single source of truth for plain-`node` callers.
 *
 * lib/sites.ts holds the TypeScript version (methaneNm3DayToKw / computeGeneratorPower)
 * for the app. This module exists ONLY because the prebuild script
 * (scripts/generate-live-stats.js) runs before any TS loader is available.
 * scripts/test-helpers.mjs asserts the two agree, so a change to one without the
 * other fails the build.
 *
 * WHY THE ÷24 MATTERS: Nm³/day ÷ Nm³/hour yields full-power HOURS PER DAY, and
 * hours × kW = kWh — a day of ENERGY, not power. Dividing by 24 turns that into
 * an average power. Omitting it made a single landfill appear to run its
 * generators for 138 hours a day, inflating portfolio kW, miner ceilings,
 * sats/day and the published headline revenue by 24×.
 */

/** Average electrical kW available from a daily methane mass (kg CH₄/day). */
function computeGeneratorPower(dailyMethaneKg, powerKW = 850, methaneNm3h = 220, derate = 0.9) {
  if (!(dailyMethaneKg > 0) || !(powerKW > 0) || !(methaneNm3h > 0)) return 0
  const dailyM3 = dailyMethaneKg / 0.717 // approx kg CH4 → Nm³
  return ((dailyM3 / methaneNm3h) * powerKW * derate) / 24
}

module.exports = { computeGeneratorPower }
