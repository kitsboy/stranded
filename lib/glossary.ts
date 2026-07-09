/** Shared glossary for tooltips and education (client-only). */
export type GlossaryEntry = { term: string; def: string }

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'Stranded Score™', def: '0–100 composite of emission scale, grid proximity, connectivity, data confidence, source deployability, and reporting recency (v3).' },
  { term: 'CH₄', def: 'Methane — greenhouse gas ~25–28× CO₂ over 100 years (GWP used in models varies by jurisdiction).' },
  { term: 'ECCC', def: 'Environment and Climate Change Canada — primary open data source for Canadian facility methane reporting.' },
  { term: 'Genset', def: 'Generator set converting methane-rich gas to electricity for on-site Bitcoin mining or load.' },
  { term: 'LCOE', def: 'Levelized cost of energy — total CapEx + opex divided by lifetime kWh.' },
  { term: 'ASIC', def: 'Application-specific integrated circuit miner optimized for Bitcoin proof-of-work.' },
  { term: 'Hashprice', def: 'Expected revenue per unit hashrate per day; moves with BTC price, difficulty, and fees.' },
  { term: 'H₂S derate', def: 'Power/efficiency reduction from hydrogen sulfide and wet gas requiring treatment.' },
  { term: 'Mission', def: 'Local portfolio of sites selected for modeling, export, and diligence packs.' },
  { term: 'Bank pack', def: 'Exportable diligence package (CSV/TSV/MD/HTML/JSON) with score factors, ROI, peers, and sensitivity.' },
  { term: 'Inferred field', def: 'Model proxy used when ECCC does not publish a value (e.g. grid distance, internet type).' },
  { term: 'Safe Harbour', def: 'Give A Bit family framing for climate + capital tools that stay transparent and community-aligned.' },
]

export function glossaryLookup(term: string): GlossaryEntry | undefined {
  const q = term.toLowerCase()
  return GLOSSARY.find(g => g.term.toLowerCase() === q || g.term.toLowerCase().includes(q))
}
