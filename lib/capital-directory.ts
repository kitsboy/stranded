/**
 * Unified Multi-Jurisdiction Capital & Grants Directory.
 *
 * Covers:
 *   - Canada Federal (Clean Tech ITC, Canada Growth Fund, CIB, Strategic Innovation Fund, NRC IRAP)
 *   - Alberta (ERA, TIER Fund, AEI, Indian Resource Council pathways)
 *   - British Columbia (BC MRF, CleanBC Industry Fund, First Nations Clean Energy Business Fund)
 *   - Ontario & Saskatchewan (Ontario Low-Carbon, SK MREP, IESO/AESO programs)
 *   - United States & North America (US DOE / IRA 45V/45Q/48E cross-border equipment & JV finance, EXIM)
 *   - European Union (Horizon Europe Cluster 5, EUREKA/Eurostars, EU Innovation Fund, EUMER 2027 compliance)
 *   - Institutional & Sovereign Infrastructure (Pension/Infra Debt, Equipment Lease, Offtake Pre-Pay)
 *
 * Honesty contract:
 *   - Every program lists its real administering body, official URL, capital type, and honest
 *     eligibility boundary (e.g. whether Bitcoin mining power load qualifies directly or only
 *     the upstream methane-destruction / CHP / engine-abatement equipment qualifies).
 */

export type CapitalJurisdiction =
  | 'canada-federal'
  | 'alberta'
  | 'bc'
  | 'ontario-sk'
  | 'usa'
  | 'europe'
  | 'institutional'

export type CapitalInstrumentType =
  | 'grant'
  | 'tax-credit'
  | 'concessional-debt'
  | 'equity-co-invest'
  | 'compliance-offtake'

export type CapitalProgramEntry = {
  id: string
  name: string
  agency: string
  jurisdiction: CapitalJurisdiction
  jurisdictionLabel: string
  flag: string
  instrument: CapitalInstrumentType
  instrumentLabel: string
  poolSize: string
  ticketRange: string
  matchOrRate: string
  /** Crucial honesty field: what part of a Stranded build actually qualifies. */
  qualifyingScope: string
  url: string
}

export const CAPITAL_JURISDICTIONS: { id: 'all' | CapitalJurisdiction; label: string; flag: string }[] = [
  { id: 'all', label: 'All Jurisdictions', flag: '🌐' },
  { id: 'canada-federal', label: 'Canada Federal', flag: '🇨🇦' },
  { id: 'alberta', label: 'Alberta', flag: '🏔️' },
  { id: 'bc', label: 'British Columbia', flag: '🌲' },
  { id: 'ontario-sk', label: 'Ontario & Sask', flag: '🌾' },
  { id: 'usa', label: 'United States', flag: '🇺🇸' },
  { id: 'europe', label: 'European Union', flag: '🇪🇺' },
  { id: 'institutional', label: 'Institutional & Sovereign', flag: '🏛️' },
]

export const CAPITAL_DIRECTORY: CapitalProgramEntry[] = [
  // CANADA FEDERAL
  {
    id: 'ca-cleantech-itc',
    name: 'Clean Technology Investment Tax Credit (ITC)',
    agency: 'Government of Canada · Department of Finance / CRA',
    jurisdiction: 'canada-federal',
    jurisdictionLabel: 'Canada Federal',
    flag: '🇨🇦',
    instrument: 'tax-credit',
    instrumentLabel: 'Refundable Tax Credit',
    poolSize: 'C$17.8B+ federal allocation',
    ticketRange: 'Up to 30% of eligible capital cost',
    matchOrRate: '30% refundable CapEx credit (with prevailing wage/apprenticeship)',
    qualifyingScope: 'Applies to eligible clean electricity / waste-heat recovery / stationary storage & qualifying zero-emission generation equipment. ASIC compute servers themselves do not qualify; upstream generation/heat-recovery plant must be structured separately.',
    url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/business-tax-credits/clean-economy-itc/clean-technology-itc.html',
  },
  {
    id: 'ca-cgf',
    name: 'Canada Growth Fund (CGF)',
    agency: 'PSP Investments (Crown Mandate)',
    jurisdiction: 'canada-federal',
    jurisdictionLabel: 'Canada Federal',
    flag: '🇨🇦',
    instrument: 'equity-co-invest',
    instrumentLabel: 'Sovereign Equity & Carbon Contracts-for-Difference',
    poolSize: 'C$15 Billion',
    ticketRange: 'C$20M – C$1B+ institutional scale',
    matchOrRate: 'Concessional equity, off-take & carbon price certainty (CCfDs)',
    qualifyingScope: 'Targets multi-site portfolio aggregation (50+ sites) that measurably abates industrial methane and locks in domestic clean-tech supply chains.',
    url: 'https://www.cgf-fcc.ca/',
  },
  {
    id: 'ca-cib',
    name: 'Canada Infrastructure Bank (CIB) — Clean Power & Indigenous Infrastructure',
    agency: 'Canada Infrastructure Bank',
    jurisdiction: 'canada-federal',
    jurisdictionLabel: 'Canada Federal',
    flag: '🇨🇦',
    instrument: 'concessional-debt',
    instrumentLabel: 'Low-Cost Project Debt',
    poolSize: 'C$35 Billion mandate (C$1B+ Indigenous envelope)',
    ticketRange: 'C$5M – C$250M+',
    matchOrRate: 'Long-tenor subordinated / senior project debt',
    qualifyingScope: 'Strong fit for First Nations equity partnerships, remote diesel-displacement microgrids (207 NRCan remote communities), and regional landfill-gas-to-power infrastructure.',
    url: 'https://cib-bic.ca/en/sectors/clean-power/',
  },
  {
    id: 'ca-sif-netzero',
    name: 'Strategic Innovation Fund (SIF) — Net Zero Accelerator',
    agency: 'Innovation, Science and Economic Development Canada (ISED)',
    jurisdiction: 'canada-federal',
    jurisdictionLabel: 'Canada Federal',
    flag: '🇨🇦',
    instrument: 'grant',
    instrumentLabel: 'Repayable / Non-Repayable Contribution',
    poolSize: 'C$8 Billion Net Zero Accelerator',
    ticketRange: 'C$10M – C$100M+ project CapEx',
    matchOrRate: 'Up to 33%–50% of eligible industrial decarbonization costs',
    qualifyingScope: 'Covers large industrial GHG abatement, flare-to-power CHP engineering, and continuous methane MRV hardware across oil, gas, and landfill portfolios.',
    url: 'https://ised-isde.canada.ca/site/strategic-innovation-fund/en',
  },
  {
    id: 'ca-eccc-lcef',
    name: 'Low Carbon Economy Fund (LCEF) & Indigenous Leadership Fund',
    agency: 'Environment and Climate Change Canada (ECCC)',
    jurisdiction: 'canada-federal',
    jurisdictionLabel: 'Canada Federal',
    flag: '🇨🇦',
    instrument: 'grant',
    instrumentLabel: 'Direct Climate Abatement Grant',
    poolSize: 'C$2.2 Billion+',
    ticketRange: 'C$500K – C$25M',
    matchOrRate: '40%–75% cost share (highest for Indigenous & municipal landfill leads)',
    qualifyingScope: 'Directly funds immediate GHG reductions (CH₄ destruction at municipal landfills, digesters, and First Nations lands).',
    url: 'https://www.canada.ca/en/environment-climate-change/services/climate-change/low-carbon-economy-fund.html',
  },

  // ALBERTA
  {
    id: 'ab-era',
    name: 'Emissions Reduction Alberta (ERA) — Methane & Industrial Transformation',
    agency: 'Emissions Reduction Alberta (funded via TIER)',
    jurisdiction: 'alberta',
    jurisdictionLabel: 'Alberta',
    flag: '🏔️',
    instrument: 'grant',
    instrumentLabel: 'Non-Dilutive TIER Grant',
    poolSize: 'C$900M+ committed across calls',
    ticketRange: 'C$500K – C$15M per project',
    matchOrRate: 'Up to 50% of eligible field pilot & scale-up CapEx',
    qualifyingScope: 'Alberta hosts 1,176 of our 2,611 mapped sites (45%). ERA funds flare/vent abatement, low-BTU gas engines, microturbines, and continuous methane sensing.',
    url: 'https://eralberta.ca/',
  },
  {
    id: 'ab-aioc',
    name: 'Alberta Indigenous Opportunities Corporation (AIOC)',
    agency: 'Government of Alberta Crown Corporation',
    jurisdiction: 'alberta',
    jurisdictionLabel: 'Alberta',
    flag: '🏔️',
    instrument: 'concessional-debt',
    instrumentLabel: 'Sovereign Loan Guarantee',
    poolSize: 'C$3 Billion guarantee capacity',
    ticketRange: 'C$20M – C$250M Indigenous equity backstop',
    matchOrRate: '100% provincial loan guarantee lowering borrowing cost to near-sovereign rates',
    qualifyingScope: 'Enables Treaty 6, 7 & 8 First Nations and Métis settlements to acquire major equity stakes in multi-site stranded-energy infrastructure with minimal upfront cash.',
    url: 'https://theaioc.com/',
  },

  // BRITISH COLUMBIA
  {
    id: 'bc-cleanbc-cif',
    name: 'CleanBC Industry Fund & Methane Reduction',
    agency: 'Province of British Columbia · Ministry of Energy',
    jurisdiction: 'bc',
    jurisdictionLabel: 'British Columbia',
    flag: '🌲',
    instrument: 'grant',
    instrumentLabel: 'Carbon-Tax Recycled Industrial Grant',
    poolSize: 'C$350M+ multi-year program',
    ticketRange: 'C$250K – C$12M',
    matchOrRate: 'Up to 50%–75% of incremental emissions-abatement CapEx',
    qualifyingScope: 'Covers BC Montney/Northeast oil & gas vent-to-power conversions and municipal landfill methane capture across 296 mapped BC sites.',
    url: 'https://www2.gov.bc.ca/gov/content/environment/climate-change/industry/cleanbc-industry-fund',
  },
  {
    id: 'bc-fncebf',
    name: 'BC First Nations Clean Energy Business Fund (FNCEBF)',
    agency: 'BC Ministry of Indigenous Relations and Reconciliation',
    jurisdiction: 'bc',
    jurisdictionLabel: 'British Columbia',
    flag: '🌲',
    instrument: 'grant',
    instrumentLabel: 'Capacity + Equity Grant & Revenue Share',
    poolSize: 'Rolling provincial clean-energy pool',
    ticketRange: 'C$50K feasibility up to C$500K+ equity per Nation',
    matchOrRate: 'Non-repayable equity & feasibility grants',
    qualifyingScope: 'Supports First Nations feasibility studies, site diligence, and equity co-investment on traditional territory energy projects.',
    url: 'https://www2.gov.bc.ca/gov/content/environment/natural-resource-stewardship/consulting-with-first-nations/first-nations-clean-energy-business-fund',
  },

  // ONTARIO & SASKATCHEWAN
  {
    id: 'on-fcm-gmf',
    name: 'FCM Green Municipal Fund — Landfill Gas & Waste-to-Energy',
    agency: 'Federation of Canadian Municipalities (Federal Endowment)',
    jurisdiction: 'ontario-sk',
    jurisdictionLabel: 'Ontario & Sask',
    flag: '🌾',
    instrument: 'concessional-debt',
    instrumentLabel: 'Blended Grant + Low-Interest Municipal Loan',
    poolSize: 'C$1.65 Billion endowment',
    ticketRange: 'Up to C$10M loan + C$1.5M grant per municipal landfill',
    matchOrRate: 'Up to 80% of eligible municipal landfill capture costs',
    qualifyingScope: 'Ontario holds 4 of the top 5 largest methane landfills in our dataset (Essex-Windsor, Twin Creeks, Keele Valley, Walker). Ideal for municipal landfill-gas power generation.',
    url: 'https://greenmunicipalfund.ca/',
  },
  {
    id: 'sk-ogepi',
    name: 'Saskatchewan Oil and Gas Processing Investment Incentive (OGPII) & Methane Programs',
    agency: 'Government of Saskatchewan · Ministry of Energy and Resources',
    jurisdiction: 'ontario-sk',
    jurisdictionLabel: 'Ontario & Sask',
    flag: '🌾',
    instrument: 'tax-credit',
    instrumentLabel: 'Transferable Royalty / Tax Credit',
    poolSize: 'Provincial flare/vent reduction framework',
    ticketRange: '15% transferable royalty credit on eligible value-added gas infrastructure',
    matchOrRate: '15% of eligible capital expenditures',
    qualifyingScope: 'Applies to associated-gas gathering, flare-gas power generation, and value-added methane commercialization across 280 mapped SK sites.',
    url: 'https://www.saskatchewan.ca/business/investment-and-economic-development/business-incentives/oil-and-gas-processing-investment-incentive',
  },

  // UNITED STATES & CROSS-BORDER
  {
    id: 'us-ira-45q-48e',
    name: 'US IRA Clean Electricity (48E) / Biogas & Cross-Border Equipment JV',
    agency: 'US Department of the Treasury / DOE Loan Programs Office (LPO)',
    jurisdiction: 'usa',
    jurisdictionLabel: 'United States',
    flag: '🇺🇸',
    instrument: 'tax-credit',
    instrumentLabel: 'US Tax Equity & Cross-Border Infrastructure Debt',
    poolSize: 'US$369B+ federal clean energy framework',
    ticketRange: 'US$5M – US$500M+ credit & tax-equity syndication',
    matchOrRate: '30%–50% ITC (US sites) + US EXIM / private infra credit for North American fleets',
    qualifyingScope: 'US energy-transition infrastructure funds (Crusoe/Lancium-class LP allocators) actively deploy into North American stranded-gas fleets; US sites qualify for domestic IRA credits while Canadian sites offer cheaper gas and 0-grid permitting.',
    url: 'https://www.energy.gov/lpo/loan-programs-office',
  },
  {
    id: 'us-epa-merp',
    name: 'US-Canada Methane Abatement & Private Carbon Offtake Pools',
    agency: 'North American Voluntary & Compliance Methane Buyers (Frontier / Symbiosis / LNG Offtakers)',
    jurisdiction: 'usa',
    jurisdictionLabel: 'United States',
    flag: '🇺🇸',
    instrument: 'compliance-offtake',
    instrumentLabel: 'Forward Methane Destruction Offtake',
    poolSize: 'US$1.5B+ corporate & compliance methane reduction commitments',
    ticketRange: 'US$25–$60 / tonne CO₂e forward contract (where baseline is measured)',
    matchOrRate: 'Multi-year revenue floor stacked on top of Bitcoin mining yield',
    qualifyingScope: 'Requires meter-verified methane flow + OpenTimestamps cryptographic proof-of-burn before claiming carbon revenue.',
    url: 'https://www.epa.gov/inflation-reduction-act/methane-emissions-reduction-program',
  },

  // EUROPEAN UNION
  {
    id: 'eu-horizon-c5',
    name: 'Horizon Europe — Pillar II, Cluster 5 (Climate, Energy & Mobility)',
    agency: 'European Commission (Canada Associated Country since July 2024)',
    jurisdiction: 'europe',
    jurisdictionLabel: 'European Union',
    flag: '🇪🇺',
    instrument: 'grant',
    instrumentLabel: 'Non-Dilutive R&D & Demonstration Grant',
    poolSize: '€95.5 Billion total Horizon pool',
    ticketRange: '€2.5M – €15M per consortium',
    matchOrRate: 'Up to 100% direct + 25% indirect cost reimbursement',
    qualifyingScope: 'Canadian entities apply on near-EU terms alongside European RTOs (TNO, Fraunhofer, SINTEF) for methane-to-power, grid-free compute, and OGMP 2.0 verification.',
    url: 'https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-5-climate-energy-and-mobility_en',
  },
  {
    id: 'eu-eumer-2027',
    name: 'EU Methane Regulation (EUMER 2027) — Commercial Inset Certificates',
    agency: 'European Union Energy Importers & LNG Aggregators',
    jurisdiction: 'europe',
    jurisdictionLabel: 'European Union',
    flag: '🇪🇺',
    instrument: 'compliance-offtake',
    instrumentLabel: 'Mandatory Import Compliance Offtake',
    poolSize: 'EU-wide fossil import verification mandate (from 1 Jan 2027)',
    ticketRange: 'Commercial B2B supply-chain verification contracts',
    matchOrRate: 'Premium pricing for verified low-methane-intensity gas supply chains',
    qualifyingScope: 'Turns our 2,611-site measurement + Satohash OTS timestamping engine into a B2B compliance product for gas exporters.',
    url: 'https://energy.ec.europa.eu/topics/carbon-management-and-fossil-fuels/methane-emissions_en',
  },

  // INSTITUTIONAL & SOVEREIGN
  {
    id: 'inst-sovereign-pension',
    name: 'Canadian Pension & Infrastructure Debt (CPP / CDPQ / AIMCo / BCI / OMERS Class)',
    agency: 'Institutional Infrastructure & Private Credit Desks',
    jurisdiction: 'institutional',
    jurisdictionLabel: 'Institutional & Sovereign',
    flag: '🏛️',
    instrument: 'concessional-debt',
    instrumentLabel: 'Senior Project Finance & Equipment Lease',
    poolSize: 'C$2.1 Trillion+ Canadian pension AUM ("Maple 8")',
    ticketRange: 'C$50M – C$2.5B structured infrastructure tranches',
    matchOrRate: '60%–70% LTV equipment debt on Jenbacher/CAT gensets + 10% Sovereign BTC Pension Royalty',
    qualifyingScope: 'Reciprocating gas generators (Jenbacher, CAT, MAN) carry 15–20 year industrial residual values and bankable collateral profiles, separating power-plant debt from ASIC compute risk.',
    url: 'https://stranded.giveabit.io/investors',
  },
]
