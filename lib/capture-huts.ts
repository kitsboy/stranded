/**
 * Methane Capture Huts & Containerized ASIC Enclosures — Vendor-Neutral Sourcing Spec.
 *
 * Pure module: no React, no external deps. Unit-testable and shared by:
 *   - components/CaptureHutSizer.tsx (interactive site/education/pitch configurator)
 *   - components/SiteDetailsPanel.tsx (per-site BOM & Copy ROI Summary)
 *   - lib/bank-pack.ts (diligence exports)
 *
 * Honesty contract:
 *   - All CapEx figures are indicative 2026 North American / global factory-gate + delivery
 *     screening ranges in CAD, never binding vendor quotes.
 *   - Hut capacity is bounded by electrical kW and miner draw (never invents extra gas).
 */

export type CoolingType = 'air-filtered' | 'hydro-closed-loop' | 'immersion-dielectric'

export type CaptureHutSpec = {
  id: string
  name: string
  footprint: string
  cooling: CoolingType
  coolingLabel: string
  maxPowerKw: number
  maxMiners: number
  ambientRangeC: string
  soundDbaAt15m: number
  capexCad: number
  leadTimeWeeks: string
  h2sScrubberCompatible: boolean
  /** Regions where this class of modular enclosure can be sourced today. */
  sourcingRegions: string[]
  /** Representative vendor/OEM classes (vendor-neutral examples, no endorsement implied). */
  sourcingExamples: string[]
  bestFor: string
  notes: string
}

export const CAPTURE_HUT_SPECS: CaptureHutSpec[] = [
  {
    id: 'skid-250',
    name: '10ft Arctic Wellhead Micro-Hut',
    footprint: '10′ × 8′ × 8.5′ ISO Skid',
    cooling: 'air-filtered',
    coolingLabel: 'Arctic louver + VFD air filtration',
    maxPowerKw: 250,
    maxMiners: 70,
    ambientRangeC: '-45°C to +40°C',
    soundDbaAt15m: 65,
    capexCad: 68000,
    leadTimeWeeks: '4–6 weeks',
    h2sScrubberCompatible: true,
    sourcingRegions: ['Alberta / Western Canada', 'US (Texas / North Dakota)', 'Global ISO fabricators'],
    sourcingExamples: ['Upstream Data (Ohmm-class)', 'Rigel Quasar skid fabricators', 'Custom AB oilfield electrical skids'],
    bestFor: 'Single stranded oil & gas wellheads, distributed wastewater digesters (<250 kW)',
    notes: 'Helicopter or picker-truck deployable. Automated intake louvers recirculate ASIC exhaust heat to prevent freezing at -45°C.',
  },
  {
    id: 'container-20ft-air',
    name: '20ft Heavy-Duty Biogas Mining Container',
    footprint: '20′ × 8′ × 9.5′ High-Cube ISO',
    cooling: 'air-filtered',
    coolingLabel: 'Dual-stage MERV-13 + evaporative assist',
    maxPowerKw: 850,
    maxMiners: 220,
    ambientRangeC: '-40°C to +42°C',
    soundDbaAt15m: 68,
    capexCad: 145000,
    leadTimeWeeks: '6–8 weeks',
    h2sScrubberCompatible: true,
    sourcingRegions: ['Canada (AB / ON / QC)', 'US Midwest / Gulf Coast', 'EU (CE-certified modular)', 'Asia (Shenzhen / Busan OEM)'],
    sourcingExamples: ['Bitmain AntBox N5-class', 'MicroBT WhatsBox air-class', 'Canadian CSA-certified modular builders'],
    bestFor: 'Pairs 1:1 with an INNIO Jenbacher J316 (850 kW) at municipal landfills or mid-size gas plants',
    notes: 'Includes CSA/UL-listed switchgear, Starlink roof mount, CH₄/H₂S gas-leak auto-shutdown interlocks, and remote PDU telemetry.',
  },
  {
    id: 'container-40ft-air',
    name: '40ft Industrial Air-Cooled Hash Hut',
    footprint: '40′ × 8′ × 9.5′ High-Cube ISO',
    cooling: 'air-filtered',
    coolingLabel: 'High-static axial wall + hot/cold aisle containment',
    maxPowerKw: 1600,
    maxMiners: 420,
    ambientRangeC: '-40°C to +40°C',
    soundDbaAt15m: 70,
    capexCad: 235000,
    leadTimeWeeks: '6–10 weeks',
    h2sScrubberCompatible: true,
    sourcingRegions: ['Canada (AB / ON)', 'United States', 'Europe', 'Global OEM direct'],
    sourcingExamples: ['EZ Blockchain SmartBox-class', 'Cryptech / Crusoe-class modular skids', 'CSA-certified oilfield E-houses'],
    bestFor: 'Pairs with Cummins QSK60G (1.5 MW) or Caterpillar G3520H (2 MW) on high-flow flare stacks',
    notes: 'Lowest CapEx per kW for air-cooled deployments. Positive-pressure filtration keeps corrosive H₂S and dust away from hashboards.',
  },
  {
    id: 'container-40ft-hydro',
    name: '40ft Closed-Loop Hydro / Immersion Pod',
    footprint: '40′ ISO + External Dry-Cooler Skid',
    cooling: 'immersion-dielectric',
    coolingLabel: 'Single-phase dielectric immersion + dry cooler',
    maxPowerKw: 2400,
    maxMiners: 560,
    ambientRangeC: '-45°C to +50°C',
    soundDbaAt15m: 54,
    capexCad: 410000,
    leadTimeWeeks: '8–12 weeks',
    h2sScrubberCompatible: true,
    sourcingRegions: ['Canada / US', 'European Union (ATEX / CE)', 'Global tier-1 liquid-cooling OEMs'],
    sourcingExamples: ['FogHashing / DCX immersion skids', 'Bitmain ANTSPACE HK3/HW5-class', 'Submer / Engineered Fluids partners'],
    bestFor: 'Sour gas (high H₂S), municipal landfills near residential zones (ultra-quiet 54 dBA), or waste-heat district co-generation',
    notes: 'Seals ASICs completely in dielectric fluid — zero exposure to corrosive landfill/wellhead air, +15–25% overclock headroom, and 50–65°C hydronic heat output for greenhouses or buildings.',
  },
]

export type GasConditioningPackage = {
  id: 'basic-knockout' | 'h2s-scrubber' | 'full-landfill-siloxane'
  name: string
  capexPerKwCad: number
  description: string
}

export const GAS_CONDITIONING_PACKAGES: GasConditioningPackage[] = [
  {
    id: 'basic-knockout',
    name: 'Sweet Gas Knockout & Chiller Skid',
    capexPerKwCad: 95,
    description: 'Moisture separator, particulate filter, and pressure regulation for relatively clean sweet wellhead gas.',
  },
  {
    id: 'h2s-scrubber',
    name: 'Sour Gas H₂S Iron-Sponge Scrubber',
    capexPerKwCad: 210,
    description: 'Removes corrosive hydrogen sulfide (H₂S) before engine intake to protect genset cylinders and exhaust catalysts.',
  },
  {
    id: 'full-landfill-siloxane',
    name: 'Full Landfill Gas (H₂S + Siloxane + Dehumidifier)',
    capexPerKwCad: 340,
    description: 'Activated carbon siloxane beds + refrigeration dryer + blower skid for municipal landfill and wastewater gas.',
  },
]

export type HutBomSummary = {
  hutSpec: CaptureHutSpec
  hutCount: number
  totalHutCapexCad: number
  conditioning: GasConditioningPackage
  conditioningCapexCad: number
  starlinkAndSwitchgearCad: number
  totalEnclosureAndGasTrainCad: number
  supportedMinersCapacity: number
  supportedPowerKwCapacity: number
}

/**
 * Recommends the best-fit capture hut class and unit count for a given electrical
 * load (kW) and miner count, plus gas conditioning based on source type.
 */
export function sizeCaptureHutsForBuild(input: {
  powerKw: number
  minerCount: number
  hutId?: string
  conditioningId?: GasConditioningPackage['id']
  sourceType?: string
}): HutBomSummary {
  const powerKw = Math.max(0, Number(input.powerKw) || 0)
  const minerCount = Math.max(0, Math.floor(Number(input.minerCount) || 0))

  const hutSpec =
    (input.hutId ? CAPTURE_HUT_SPECS.find(h => h.id === input.hutId) : undefined) ||
    (powerKw <= 250
      ? CAPTURE_HUT_SPECS[0]
      : powerKw <= 850
        ? CAPTURE_HUT_SPECS[1]
        : powerKw <= 1600
          ? CAPTURE_HUT_SPECS[2]
          : CAPTURE_HUT_SPECS[3])

  const byPower = powerKw > 0 ? Math.ceil(powerKw / hutSpec.maxPowerKw) : 1
  const byMiners = minerCount > 0 ? Math.ceil(minerCount / hutSpec.maxMiners) : 1
  const hutCount = Math.max(1, byPower, byMiners)

  const src = (input.sourceType || '').toLowerCase()
  const defaultCondId: GasConditioningPackage['id'] =
    src.includes('landfill') || src.includes('waste')
      ? 'full-landfill-siloxane'
      : src.includes('oil') || src.includes('gas') || src.includes('coal')
        ? 'h2s-scrubber'
        : 'basic-knockout'

  const conditioning =
    GAS_CONDITIONING_PACKAGES.find(c => c.id === (input.conditioningId || defaultCondId)) ||
    GAS_CONDITIONING_PACKAGES[0]

  const totalHutCapexCad = hutCount * hutSpec.capexCad
  const conditioningCapexCad = Math.round(Math.max(100, powerKw) * conditioning.capexPerKwCad)
  const starlinkAndSwitchgearCad = hutCount * 12500

  return {
    hutSpec,
    hutCount,
    totalHutCapexCad,
    conditioning,
    conditioningCapexCad,
    starlinkAndSwitchgearCad,
    totalEnclosureAndGasTrainCad: totalHutCapexCad + conditioningCapexCad + starlinkAndSwitchgearCad,
    supportedMinersCapacity: hutCount * hutSpec.maxMiners,
    supportedPowerKwCapacity: hutCount * hutSpec.maxPowerKw,
  }
}
