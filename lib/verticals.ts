export type EnergyVertical = {
  id: string
  name: string
  icon: string
  color: string
  status: 'live' | 'beta' | 'roadmap'
  description: string
  potentialSites: number
  avgPowerKw: number
  btcFit: string
  section?: {
    headline: string
    bullets: string[]
    mapHint?: string
  }
}

export const ENERGY_VERTICALS: EnergyVertical[] = [
  {
    id: 'methane',
    name: 'Stranded Methane',
    icon: '🔥',
    color: '#FF8C00',
    status: 'live',
    description: '2,611 ECCC-verified vent/flare sites. Live map, ROI, generators.',
    potentialSites: 2611,
    avgPowerKw: 850,
    btcFit: 'Primary — zero grid, immediate offtaker',
  },
  {
    id: 'wind',
    name: 'Curtailed Wind',
    icon: '💨',
    color: '#60A5FA',
    status: 'beta',
    description: 'Grid-curtailed wind farms in AB/SK. Battery + mining buffer.',
    potentialSites: 340,
    avgPowerKw: 5000,
    btcFit: 'High — flexible load absorbs spill',
    section: {
      headline: 'Curtailed Wind in the Prairies',
      bullets: [
        'Alberta & Saskatchewan see recurring negative-price hours — ideal for interruptible mining load',
        'Containerized ASIC farms can ramp 0→100% in minutes to absorb spill without grid contracts',
        '~340 candidate wind farms identified via IESO/AESO curtailment reports (beta dataset)',
      ],
      mapHint: 'Filter AB/SK power_generation sites on the live map as a methane-adjacent proxy',
    },
  },
  {
    id: 'solar',
    name: 'Curtailed Solar',
    icon: '☀️',
    color: '#FBBF24',
    status: 'beta',
    description: 'Behind-the-meter solar spill in ON/BC. Daytime mining clusters.',
    potentialSites: 180,
    avgPowerKw: 1200,
    btcFit: 'Strong — daytime hash fits curtailment',
  },
  {
    id: 'waste-heat',
    name: 'Waste Heat Recovery',
    icon: '♨️',
    color: '#F472B6',
    status: 'beta',
    description: 'Industrial exhaust, data centre heat, flare stack thermal.',
    potentialSites: 420,
    avgPowerKw: 800,
    btcFit: 'Emerging — ORC + immersion cooling',
    section: {
      headline: 'Waste Heat → Hash',
      bullets: [
        'Pulp & paper, refineries, and data centres vent megawatts of low-grade heat daily',
        'Organic Rankine Cycle (ORC) + immersion cooling pairs well with stranded ASIC deployments',
        'Stacked with methane capture: treat exhaust heat as bonus kW after genset prime power',
      ],
      mapHint: 'Explore pulp_paper and refinery source types for heat-adjacent methane sites',
    },
  },
  {
    id: 'biomass',
    name: 'Biomass & Biogas',
    icon: '🌿',
    color: '#34D399',
    status: 'roadmap',
    description: 'Agricultural digesters, forestry residues, landfill gas expansion.',
    potentialSites: 290,
    avgPowerKw: 600,
    btcFit: 'Proven — genset + mining stack exists',
  },
  {
    id: 'hydro',
    name: 'Hydro Spill',
    icon: '💧',
    color: '#5BC0BE',
    status: 'roadmap',
    description: 'Remote micro-hydro spill in BC/QC/NWT. Seasonal surplus.',
    potentialSites: 75,
    avgPowerKw: 3000,
    btcFit: 'Excellent — baseload + spill capture',
  },
]