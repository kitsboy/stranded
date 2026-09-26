'use client'

import { useState, useMemo, useEffect, useId, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { GENSET_DATA, GensetId, EnrichedSite } from '@/lib/sites'
import { computeAdvancedRoi } from '@/lib/roi-model'
import { toggleBookmark, getBookmarks } from '@/lib/bookmarks'
import { getSiteNote, setSiteNote } from '@/lib/site-notes'
import Link from 'next/link'
import RoiProjectionChart from '@/components/RoiProjectionChart'
import { integrationUrl } from '@/lib/integrations'
import { explainStrandedScore, scoreTierClass, scoreTier } from '@/lib/scoring'
import { findPeerSites, peerSummary } from '@/lib/peers'
import { sensitivityTornado } from '@/lib/sensitivity'
import { bankPackMarkdown, bankPackCsv, bankPackTsv, bankPackHtml, bankPackJson } from '@/lib/bank-pack'
import { downloadBlob } from '@/lib/export-formats'
import { toast } from 'sonner'
import { useBtcPrice } from '@/components/BtcPriceProvider'
import { recordScoreVisit, getScoreHistory } from '@/lib/score-history'
import ScoreSparkline from '@/components/ScoreSparkline'
import TadbuyAdHook from '@/components/TadbuyAdHook'
import GeneratorDerateChart from '@/components/GeneratorDerateChart'
import { trackCategory } from '@/lib/analytics'
import {
  fluxScopeNotApplicable,
  FLUX_NO_SPLIT_LABEL,
  FLUX_NO_SPLIT_HINT,
} from '@/lib/map-filters'
import { motion } from 'framer-motion'
import { Send, Link2 } from 'lucide-react'
import ExportFormatPicker, { type ExportFormat } from '@/components/ExportFormatPicker'
import BankPackPreview from '@/components/BankPackPreview'
import CopyLinkButton from '@/components/CopyLinkButton'
import PinProof from '@/components/trust/PinProof'
import { useLocale } from '@/lib/useLocale'
import { assessSiteDataQuality } from '@/lib/data-quality'
import { scoreConfidenceBand } from '@/lib/score-confidence'
import { computeVerticalScores } from '@/lib/vertical-scores'
import { hasCarbonBaseline, carbonBaselineLabel } from '@/lib/carbon-overlay'
import DataQualityBadge from '@/components/DataQualityBadge'
import ConfidenceBandBar from '@/components/ConfidenceBandBar'
import VerticalScoreGrid from '@/components/VerticalScoreGrid'
import MonteCarloPanel from '@/components/MonteCarloPanel'
import GasDeclineChart from '@/components/GasDeclineChart'
import FormulaTip from '@/components/FormulaTip'
import CaseStudyExport from '@/components/CaseStudyExport'
import CapexFxControls from '@/components/CapexFxControls'
import AmortizationTable from '@/components/AmortizationTable'
import {
  ASIC_MACHINES,
  MINER_STACK_PRESETS,
  DEFAULT_FLEET_ASSUMPTIONS,
  encodeFleet,
  fleetPresetForSourceType,
  minerCeiling,
  resolveFleetForSite,
  siteGasCeilingKw,
  unusedCapacity,
  saveNamedFleet,
  listNamedFleets,
  deleteNamedFleet,
  type NamedFleetRecord,
  type FleetExportBlock,
  type FleetGenset,
  type FleetSite,
  type FleetTemplate,
} from '@/lib/fleet-template'
import { computeFleetModel, NETWORK_ESTIMATE_BTC_PER_TH_DAY, NETWORK_DERIVED_BTC_PER_TH_DAY, NETWORK_HASHRATE_THS, NETWORK_DAILY_BTC_ISSUANCE, DEFAULT_POWER_COST_USD_PER_KWH } from '@/lib/fleet-model'
import {
  blockScaleLabel,
  capacityModel,
  dataRecencyBadge,
  fluxBadge,
  formatCount,
  formatKw,
  formatMoneyFiat,
  formatPayback,
  formatSats,
  hashpriceRead,
  satsPerDay,
} from '@/lib/cockpit'
import MinerStackCockpit, { type CockpitPreview } from '@/components/MinerStackCockpit'
import MinerStackThumbBar from '@/components/MinerStackThumbBar'
import BuildSummary from '@/components/BuildSummary'
import FleetTemplateShelf, { type ShelfResult } from '@/components/FleetTemplateShelf'

const FIAT_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const

type FiatCode = typeof FIAT_OPTIONS[number]['code']
type BtcPriceMap = Record<Lowercase<FiatCode>, number>

/** Human label for a genset inventory: "2 × INNIO Jenbacher J316 GS-B.L + 1 × …" */
function gensetStackLabel(stack: FleetGenset[]): string {
  const parts = (stack || [])
    .filter(g => GENSET_DATA[g.gensetId] && (g.count || 0) > 0)
    .map(g => `${g.count} × ${GENSET_DATA[g.gensetId].name}`)
  return parts.length ? parts.join(' + ') : 'no genset'
}

/**
 * The phone sheet's four sections. The docked desktop cockpit shows every
 * block at once — sections are a small-screen affordance, and each block below
 * is annotated with the section it belongs to (`sectionOff`), so nothing is
 * rendered twice and nothing is unmounted when the reader switches.
 */
const SITE_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'build', label: 'Build' },
  { id: 'financials', label: 'Financials' },
  { id: 'evidence', label: 'Evidence' },
] as const
type SiteSectionId = (typeof SITE_SECTIONS)[number]['id']

export default function SiteDetailsPanel({ 
  site, 
  onClose, 
  onAddToMission, 
  liveBtcPrice = 85000,
  allSites = [],
  compact = false,
  onExpand,
  initialFleet = null,
  /** Rendered inside the mobile bottom sheet — adds the sticky thumb-zone controls. */
  sheet = false,
}: { 
  site: any
  onClose: () => void
  onAddToMission?: (site: any) => void
  liveBtcPrice?: number
  allSites?: EnrichedSite[]
  /** Mobile peek mode — header summary only */
  compact?: boolean
  onExpand?: () => void
  /** Fleet template restored from a share link (already capped to this site) */
  initialFleet?: FleetTemplate | null
  sheet?: boolean
}) {
  const { t } = useLocale()
  const p = site?.properties || {}
  const siteEmission = p.emission_rate_kg_day || 0

  const { fiats: sharedFiats } = useBtcPrice()
    const [selectedFiat, setSelectedFiat] = useState<FiatCode>(() => {
      if (typeof window === 'undefined') return 'USD'
      const saved = window.localStorage.getItem('stranded-fiat')
      return (saved && FIAT_OPTIONS.some(f => f.code === saved)) ? saved as FiatCode : 'USD'
    })
  const [btcPrices, setBtcPrices] = useState<BtcPriceMap>({ usd: 85000, eur: 78000, jpy: 12500000, gbp: 65000, cad: 115000 })
  const [selectedASIC, setSelectedASIC] = useState(
    () => ASIC_MACHINES.find(m => m.id === initialFleet?.asicId) || ASIC_MACHINES[0],
  )
  const [machineCount, setMachineCount] = useState(() => {
    if (initialFleet) return Math.max(0, initialFleet.minerCount || 0)
    return 100
  })
  const [overclockPercent, setOverclockPercent] = useState(initialFleet?.overclockPercent || 0)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [btcPrice, setBtcPrice] = useState(85000) // Price of 1 BTC in the *selected* fiat (BTC is always the base)
  const [uptimePercent, setUptimePercent] = useState(95)

  // Generator integration for real per-site Value (CapEx on production side)
  const [selectedGenset, setSelectedGenset] = useState<GensetId>(
    () => initialFleet?.gensets?.[0]?.gensetId || 'jenbacher316',
  )
  /** Installed inventory shares one site-wide fuel budget. */
  const [gensetStack, setGensetStack] = useState<FleetGenset[]>(() =>
    initialFleet
      ? initialFleet.gensets.map(g => ({ ...g }))
      : [{ gensetId: 'jenbacher316', count: 1 }],
  )
  /** auto = "Fill the gas" (miners fill the ceiling, max capture); manual = "My build" */
  const [stackMode, setStackMode] = useState<'auto' | 'manual'>(
    () => initialFleet?.mode || 'auto',
  )
  const [fleetId, setFleetId] = useState<string>(() => initialFleet?.id || 'custom')
  const [debtPercent, setDebtPercent] = useState(60)
  const [interestRate, setInterestRate] = useState(8)
  // Named fleet templates — local-first save/reuse
  const [namedFleets, setNamedFleets] = useState<NamedFleetRecord[]>(() => listNamedFleets())
  const [showSaveFleetName, setShowSaveFleetName] = useState(false)
  const [fleetNameInput, setFleetNameInput] = useState('')

  // Advanced parameters for more honest modeling
  const [fixedSetupCostCad, setFixedSetupCostCad] = useState(25000) // One-time site prep, generator base, install, etc.
  const [poolFeePercent, setPoolFeePercent] = useState(1.5)
  const [maintenanceAnnualPercent, setMaintenanceAnnualPercent] = useState(5)
  const [revenuePerThPerDayBtc, setRevenuePerThPerDayBtc] = useState(0.0000009)
  /**
   * Honest hashprice inputs (Fix: optimistic must be visible). Net value derived
   * live from the two editable network inputs; anything above it is an optimistic scenario.
   */
  const [networkHashrateThs, setNetworkHashrateThs] = useState(NETWORK_HASHRATE_THS)
  const [networkDailyIssuanceBtc, setNetworkDailyIssuanceBtc] = useState(NETWORK_DAILY_BTC_ISSUANCE)
  /** Power cost editable — a stranded-gas site has O&M-only electricity (≈0.015). */
  const [powerCostUsdPerKwh, setPowerCostUsdPerKwh] = useState(DEFAULT_POWER_COST_USD_PER_KWH)
  const [gasTreatmentDerate, setGasTreatmentDerate] = useState(1.0)
  const [historicalBtcUsd, setHistoricalBtcUsd] = useState(0)
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1.0)
  /** Bear/Base/Bull scenario — scales BTC price & hashprice instantly across the whole card. */
  const [scenario, setScenario] = useState<'bear' | 'base' | 'bull'>('base')
  const [bookmarked, setBookmarked] = useState(false)
  const [note, setNote] = useState('')
  const [scoreHistory, setScoreHistory] = useState<number[]>([])
  const [exportFmt, setExportFmt] = useState<ExportFormat>('md')
  const [showBankPreview, setShowBankPreview] = useState(false)
  /** Phone sheet only: which of the four sections is on screen (default Overview). */
  const [section, setSection] = useState<SiteSectionId>('overview')
  const sectionPanelId = useId()
  const panelScrollRef = useRef<HTMLDivElement>(null)
  const sectionTabRefs = useRef<Partial<Record<SiteSectionId, HTMLButtonElement | null>>>({})

  useEffect(() => {
    if (!site) return
    setBookmarked(getBookmarks().includes(site.id))
    setNote(getSiteNote(site.id))
    // A newly selected site always opens on Overview — never on the section the
    // previous site was left on.
    setSection('overview')
    if (typeof site.strandedScore === 'number') {
      recordScoreVisit(site.id, site.strandedScore)
      setScoreHistory(getScoreHistory(site.id))
    }
  }, [site])

  const currentFiat = FIAT_OPTIONS.find(f => f.code === selectedFiat) || FIAT_OPTIONS[0]
  const currencySymbol = currentFiat.symbol

  // Bear/Base/Bull scenario multipliers (BTC price & hashprice scale together).
  const SCENARIO = {
    bear: { btc: 0.70, hash: 0.70, label: 'Bear' },
    base: { btc: 1.00, hash: 1.00, label: 'Base' },
    bull: { btc: 1.30, hash: 1.30, label: 'Bull' },
  }
  const scenarioMul = SCENARIO[scenario]
  /** BTC price in the selected fiat, scaled by the chosen scenario. */
  const scenarioBtcPrice = btcPrice * scenarioMul.btc
  /** Hashprice scale applied to the model. */
  const scenarioHashMultiplier = scenarioMul.hash

  // Sync multi-fiat map from shared provider (single CoinGecko poll site-wide)
  useEffect(() => {
    const prices: BtcPriceMap = {
      usd: sharedFiats.usd,
      eur: sharedFiats.eur,
      jpy: sharedFiats.jpy,
      gbp: sharedFiats.gbp,
      cad: sharedFiats.cad,
    }
    setBtcPrices(prices)
    const key = selectedFiat.toLowerCase() as Lowercase<FiatCode>
    setBtcPrice(prices[key] || prices.usd)
  }, [sharedFiats, selectedFiat])

  const handleFiatChange = (newFiat: FiatCode) => {
    setSelectedFiat(newFiat)
    if (typeof window !== 'undefined') window.localStorage.setItem('stranded-fiat', newFiat)
    const live = btcPrices[newFiat.toLowerCase() as Lowercase<FiatCode>]
    if (live) setBtcPrice(live)
  }

  /** Convert a CAD-denominated value into the selected fiat (for the fixed-setup input). */
  const cadToFiat = (cad: number): number => {
    const cadPrice = btcPrices.cad || 115000
    const selPrice = btcPrices[selectedFiat.toLowerCase() as Lowercase<FiatCode>] || btcPrices.usd
    return cad * (selPrice / cadPrice)
  }
  /** Convert a selected-fiat value back into CAD (the model's internal unit). */
  const fiatToCad = (val: number): number => {
    const cadPrice = btcPrices.cad || 115000
    const selPrice = btcPrices[selectedFiat.toLowerCase() as Lowercase<FiatCode>] || btcPrices.usd
    return val * (cadPrice / selPrice)
  }

  /**
   * Fleet economics live in lib/fleet-model.ts so the cockpit preview, this panel's
   * readouts and the exports can never disagree. Same inputs, same arithmetic.
   */
  const modelInput = useMemo(() => ({
    site: site as FleetSite,
    gensets: gensetStack,
    asic: selectedASIC,
    overclockPercent,
    btcPrice: scenarioBtcPrice,
    btcPrices,
    uptimePercent,
    poolFeePercent,
    maintenanceAnnualPercent,
    revenuePerThPerDayBtc: revenuePerThPerDayBtc * scenarioHashMultiplier,
    fixedSetupCostCad,
    powerCostUsdPerKwh,
    debtPercent,
    interestRate,
  }), [
    site, gensetStack, selectedASIC, overclockPercent, scenarioBtcPrice, btcPrices, uptimePercent,
    poolFeePercent, maintenanceAnnualPercent, revenuePerThPerDayBtc, scenarioHashMultiplier, fixedSetupCostCad,
    powerCostUsdPerKwh, debtPercent, interestRate,
  ])

  const calculations = useMemo(() => (
    site ? computeFleetModel({ ...modelInput, machineCount, gensetName: gensetStackLabel(gensetStack) }) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [site, modelInput, machineCount])

  /** The site-model's payback at the grid-ish default 0.04 — so the power-cost edit always shows before/after. */
  const defaultPowerPaybackDays = useMemo(() => {
    if (!site) return null
    const m = computeFleetModel({ ...modelInput, powerCostUsdPerKwh: DEFAULT_POWER_COST_USD_PER_KWH, machineCount })
    return m.paybackDays
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, modelInput, machineCount])

  /** The cockpit asks for any candidate count (drag, ±, typed) and gets the same model back. */
  const previewFor = useMemo(
    () => (count: number): CockpitPreview => {
      const m = computeFleetModel({ ...modelInput, machineCount: count })
      return {
        satsPerDay: satsPerDay(m.effectiveDailyBtc),
        usdPerDay: m.dailyRevenueFiat,
        netUsdPerDay: m.dailyProfitFiat,
        kwUsed: m.usedPowerKw,
        paybackDays: m.paybackDays,
      }
    },
    [modelInput],
  )

  // Auto mode: the miner stack always fills the gas ceiling (maximum capture)
  useEffect(() => {
    if (stackMode !== 'auto') return
    const watts = selectedASIC.power_w * (1 + overclockPercent / 100) * (1 + overclockPercent / 200)
    const ceiling = minerCeiling(siteGasCeilingKw(site, gensetStack), watts)
    setMachineCount(ceiling)
  }, [stackMode, gensetStack, selectedASIC, site, overclockPercent])

  /**
   * The panel's headline fiat format lives in lib/cockpit.ts so the ROI summary
   * and the build summary strip quote the exact same string for the same value
   * (and so the format itself is unit-tested). Behaviour is unchanged.
   */
  const fmt = (val: number) => formatMoneyFiat(val, currencySymbol)

  const fmtBtc = (val: number) => {
      if (!isFinite(val) || isNaN(val)) return '0.000000'
      return val.toFixed(6)
    }

    /** Builds the rich, lightly-branded ROI summary copied to the clipboard. */
    const buildRoiSummary = (): string => {
      if (!site || !calculations) return ''
      const c = calculations
      const payback = (d: number) => isFinite(d) ? `${Math.round(d).toLocaleString()} days (${(d / 365).toFixed(1)} yr)` : 'N/A'
      const sats = satsPerDay(c.effectiveDailyBtc).toLocaleString()
      const scoreTierLabel = site.strandedScore >= 85 ? 'Elite' : site.strandedScore >= 65 ? 'High' : site.strandedScore >= 45 ? 'Med' : 'Low'
      const mapUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'}/map?site=${site.id}`
      const lines: string[] = []
      lines.push('══════════════════════════════════════════════════════════')
      lines.push('STRANDED VALUE — ROI SUMMARY')
      lines.push(`${p.name} · ${p.province}`)
      lines.push('══════════════════════════════════════════════════════════')
      lines.push('')
      lines.push('SITE')
      if (p.company) lines.push(`  Company:      ${p.company}`)
      if (p.city) lines.push(`  Location:     ${p.city}, ${p.province}`)
      lines.push(`  Source:       ${p.source_type}${p.naics_description ? ` (${p.naics_description})` : ''}`)
      lines.push(`  Reported CH₄: ${siteEmission.toLocaleString()} kg/day · ${(p.ch4_tonnes_year || 0).toLocaleString()} t/yr`)
      lines.push(`  Stranded Score: ${site.strandedScore} (${scoreTierLabel})${site.scoreBadge ? ` · ${site.scoreBadge}` : ''}`)
      lines.push(`  Data:         ECCC ${p.reference_year || '—'} · ${p.confidence || '—'} confidence`)
      lines.push(`  Map:          ${mapUrl}`)
      lines.push('')
      lines.push('BUILD')
      lines.push(`  Miners:       ${c.effectiveMachineCount.toLocaleString()} × ${selectedASIC.name} (${selectedASIC.hashrate_ths} TH/s @ ${selectedASIC.power_w} W)`)
      lines.push(`  Generator:    ${c.gensetName} (${c.generatorPowerKw.toFixed(1)} kW from site gas)`)
      lines.push(`  Power used:   ${c.usedPowerKw.toFixed(1)} of ${c.generatorPowerKw.toFixed(1)} kW (gas ceiling)`)
      lines.push(`  Mode:         ${stackMode === 'auto' ? 'Fill the gas (max capture)' : 'My build (manual)'}`)
      lines.push('')
      lines.push('DAILY ECONOMICS (BTC-first)')
      lines.push(`  Revenue:      ${fmtBtc(c.dailyRevenueBtc)} BTC (${fmt(c.dailyRevenueFiat)})`)
      lines.push(`  Power cost:   ${fmtBtc(c.dailyPowerCostBtc)} BTC (${fmt(c.dailyPowerCostFiat)})`)
      lines.push(`  Maintenance:  ${fmtBtc(c.dailyMaintBtc)} BTC (${fmt(c.dailyMaintFiat)})`)
      lines.push(`  NET PROFIT:   ${fmtBtc(c.dailyProfitBtc)} BTC (${fmt(c.dailyProfitFiat)}/day)`)
      lines.push(`  Monthly net:  ${fmtBtc(c.monthlyProfitBtc)} BTC (${fmt(c.monthlyProfitFiat)})`)
      lines.push(`  Sats/day:     ${sats} sats`)
      lines.push('')
      lines.push('INVESTMENT')
      lines.push(`  Hardware:     ${c.hardwareCostBtc.toFixed(4)} BTC (${fmt(c.hardwareCostFiat)})`)
      lines.push(`  Fixed setup:  ${c.fixedCostBtc.toFixed(4)} BTC (${fmt(c.fixedCostFiat)})`)
      lines.push(`  Generator:    ${c.gensetCapexBtc.toFixed(4)} BTC (${c.gensetName})`)
      lines.push(`  TOTAL:        ${c.totalInvestmentBtc.toFixed(4)} BTC (${fmt(c.totalInvestmentFiat)})`)
      lines.push('')
      lines.push('PAYBACK')
      lines.push(`  Total capital:  ${payback(c.paybackDays)}`)
      lines.push(`  Marginal (per extra miner): ${payback(c.marginalPayback)}`)
      lines.push(`  Financed (${debtPercent}% debt @ ${interestRate}%): ${payback(c.financedPaybackDays)}`)
      lines.push('')
      lines.push('METHANE IMPACT')
      lines.push(`  Captured:     ${(siteEmission * 0.96).toLocaleString()} kg/day (est. 96%)`)
      lines.push(`  Methane loss if vented: ${c.methaneLossDailyBtc.toFixed(4)} BTC/day`)
      lines.push('')
      lines.push('ASSUMPTIONS (honest)')
      lines.push(`  Hashprice:    ${c.hashpriceUsdPerThDay.toFixed(4)} USD/TH/day — ${isOptimistic ? 'optimistic scenario (above network-derived)' : 'in line with network'}`)
      lines.push(`  Power cost:   ${powerCostUsdPerKwh.toFixed(3)} USD/kWh`)
      lines.push(`  BTC price:    ${fmt(scenarioBtcPrice)} (${selectedFiat}${scenario !== 'base' ? ` · ${scenarioMul.label} scenario` : ''})`)
      lines.push(`  Data year:    ${p.reference_year || '—'} — measured, not modelled`)
      lines.push('')
      lines.push('DISCLAIMER: Simplified model for education only. Real mining revenue varies with network difficulty, fees, hardware degradation, gas composition, weather, downtime and regulation. Not investment advice.')
      lines.push('')
      lines.push('— Generated by Stranded Value · GiveAbit Intelligence')
            return lines.join('\n')
          }

  const advancedRoi = site ? computeAdvancedRoi(site, selectedGenset, {
    liveBtcUsd: btcPrice,
    historicalBtcUsd: historicalBtcUsd || undefined,
    difficultyMultiplier,
    gasTreatmentDerate,
    txFeeBtcPerDay: 0.0002,
  }) : null

  const scoreExplain = useMemo(() => (site ? explainStrandedScore(site) : null), [site])
  const peers = useMemo(() => {
    if (!site || !allSites.length) return []
    return findPeerSites(site as EnrichedSite, allSites, 5)
  }, [site, allSites])
  const peerMeta = useMemo(() => (site && peers.length ? peerSummary(site as EnrichedSite, peers) : null), [site, peers])
  const tornado = useMemo(() => (site ? sensitivityTornado(site as EnrichedSite, liveBtcPrice) : []), [site, liveBtcPrice])
  const dataQuality = useMemo(
    () => (site ? assessSiteDataQuality(p, site.geometry) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [site?.id],
  )
  const confBand = useMemo(() => {
    if (!site || typeof site.strandedScore !== 'number') return null
    return scoreConfidenceBand(site.strandedScore, p, dataQuality?.score)
  }, [site, p, dataQuality?.score])
  const verticalScores = useMemo(
    () =>
      computeVerticalScores(
        { source_type: p.source_type, confidence: p.confidence, province: p.province },
        siteEmission,
        site?.strandedScore ?? 0,
      ),
    [site?.strandedScore, siteEmission, p.source_type, p.confidence, p.province],
  )
  const carbonBaseline = hasCarbonBaseline(p as Record<string, unknown>)

  if (!site || !calculations) return null

  const downloadBankPack = (fmt: 'md' | 'csv' | 'tsv' | 'html' | 'json') => {
    const sites = [site as EnrichedSite]
    const fleet: FleetExportBlock = { template: fleetTemplate, site: siteAsFleet, paybackDays: isFinite(calculations.paybackDays) ? calculations.paybackDays : null }
    const base = `stranded-bank-pack-${(p.name || site.id || 'site').toString().replace(/[^\w-]+/g, '_').slice(0, 40)}`
    if (fmt === 'md') downloadBlob(bankPackMarkdown(sites, allSites, { liveBtcUsd: liveBtcPrice, fleet }), `${base}.md`, 'text/markdown')
    else if (fmt === 'csv') downloadBlob(bankPackCsv(sites, { liveBtcUsd: liveBtcPrice, fleet }), `${base}.csv`, 'text/csv')
    else if (fmt === 'tsv') downloadBlob(bankPackTsv(sites, { liveBtcUsd: liveBtcPrice, fleet }), `${base}.tsv`, 'text/tab-separated-values')
    else if (fmt === 'html') {
      const w = window.open('', '_blank')
      if (w) { w.document.write(bankPackHtml(sites, { liveBtcUsd: liveBtcPrice, fleet })); w.document.close() }
    } else downloadBlob(JSON.stringify(bankPackJson(sites, { liveBtcUsd: liveBtcPrice, fleet }), null, 2), `${base}.json`, 'application/json')
  }

  const mapDeepLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'}/map?site=${site.id}`

  /** Open a branded one-page PDF (via browser print) of the whole card. */
  const downloadPdf = () => {
    const fmtUsdLocal = (n: number) => formatMoneyFiat(n, currentFiat.symbol)
    const st = `<html><head><title>Stranded Value — ${p.name}</title>
      <style>
        body{font-family:system-ui,sans-serif;background:#0f172a;color:#fff;padding:32px;max-width:820px;margin:0 auto;line-height:1.5}
        .brand{font-size:10px;letter-spacing:2px;color:#5BC0BE;text-transform:uppercase;margin-bottom:2px}
        h1{font-size:26px;margin:0 0 2px}
        .sub{color:#94a3b8;font-size:13px;margin-bottom:20px}
        h2{font-size:14px;color:#FF8C00;border-bottom:1px solid #334155;padding-bottom:4px;margin:22px 0 10px}
        .row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .row .k{color:#94a3b8}.row .v{font-weight:600;text-align:right}
        .disclaimer{font-size:10px;color:#64748b;margin-top:24px;border-top:1px solid #334155;padding-top:12px}
        .foot{margin-top:16px;font-size:10px;letter-spacing:1px;color:#5BC0BE;text-transform:uppercase}
        table{width:100%;border-collapse:collapse;font-size:12px}.row td{padding:3px 0}
      </style></head><body>
      <div class="brand">GiveAbit Intelligence · Stranded Value</div>
      <h1>${p.name}</h1>
      <div class="sub">${p.city ? p.city + ', ' : ''}${p.province} · Score ${site.strandedScore} (${scoreTier(site.strandedScore)}) · ECCC ${p.reference_year || ''} · ${siteEmission.toLocaleString()} kg CH₄/day</div>

      <h2>Build</h2>
      <div class="row"><span class="k">Miners</span><span class="v">${calculations.effectiveMachineCount.toLocaleString()} × ${selectedASIC.name}</span></div>
      <div class="row"><span class="k">Generator</span><span class="v">${calculations.gensetName} · ${calculations.generatorPowerKw.toFixed(1)} kW from gas</span></div>
      <div class="row"><span class="k">Power used</span><span class="v">${calculations.usedPowerKw.toFixed(1)} of ${calculations.generatorPowerKw.toFixed(1)} kW</span></div>

      <h2>Daily Economics (BTC-first)</h2>
      <div class="row"><span class="k">Revenue</span><span class="v">${calculations.dailyRevenueBtc.toFixed(6)} BTC · ${fmtUsdLocal(calculations.dailyRevenueFiat)}</span></div>
      <div class="row"><span class="k">Power cost</span><span class="v">${calculations.dailyPowerCostBtc.toFixed(6)} BTC · ${fmtUsdLocal(calculations.dailyPowerCostFiat)}</span></div>
      <div class="row"><span class="k">Maintenance</span><span class="v">${calculations.dailyMaintBtc.toFixed(6)} BTC · ${fmtUsdLocal(calculations.dailyMaintFiat)}</span></div>
      <div class="row"><span class="k">Net profit</span><span class="v">${calculations.dailyProfitBtc.toFixed(6)} BTC · ${fmtUsdLocal(calculations.dailyProfitFiat)}/day</span></div>
      <div class="row"><span class="k">Monthly net</span><span class="v">${calculations.monthlyProfitBtc.toFixed(6)} BTC · ${fmtUsdLocal(calculations.monthlyProfitFiat)}</span></div>

      <h2>Investment</h2>
      <div class="row"><span class="k">Hardware</span><span class="v">${calculations.hardwareCostBtc.toFixed(4)} BTC · ${fmtUsdLocal(calculations.hardwareCostFiat)}</span></div>
      <div class="row"><span class="k">Fixed setup</span><span class="v">${calculations.fixedCostBtc.toFixed(4)} BTC · ${fmtUsdLocal(calculations.fixedCostFiat)}</span></div>
      <div class="row"><span class="k">Generator CapEx</span><span class="v">${calculations.gensetCapexBtc.toFixed(4)} BTC</span></div>
      <div class="row"><span class="k">Total</span><span class="v">${calculations.totalInvestmentBtc.toFixed(4)} BTC · ${fmtUsdLocal(calculations.totalInvestmentFiat)}</span></div>

      <h2>Payback</h2>
      <div class="row"><span class="k">Total capital</span><span class="v">${isFinite(calculations.paybackDays) ? Math.round(calculations.paybackDays).toLocaleString() + ' days' : 'N/A'}</span></div>
      <div class="row"><span class="k">Marginal (per miner)</span><span class="v">${isFinite(calculations.marginalPayback) ? Math.round(calculations.marginalPayback).toLocaleString() + ' days' : 'N/A'}</span></div>
      <div class="row"><span class="k">Financed (${debtPercent}% @ ${interestRate}%)</span><span class="v">${isFinite(calculations.financedPaybackDays) ? Math.round(calculations.financedPaybackDays).toLocaleString() + ' days' : 'N/A'}</span></div>

      <div class="disclaimer">Simplified model for education only. Real mining revenue varies with difficulty, fees, hardware degradation, gas composition, weather, downtime and regulation. Not investment advice.</div>
      <div class="foot">Stranded Value · GiveAbit Intelligence · ${mapDeepLink}</div>
      </body></html>`
    const w = window.open('', '_blank')
    if (!w) { toast.error('Popup blocked — allow popups to export PDF'); return }
    w.document.write(st)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 400)
    toast.success('PDF opened — choose "Save as PDF"')
  }

  // ---- Editable miner stack (fleet template) ----------------------------------
  const siteAsFleet: FleetSite = site as FleetSite
  const ceilingMiners = calculations.ceilingMiners
  const atGasCeiling = ceilingMiners > 0 && machineCount >= ceilingMiners
  const headGenset = (gensetStack[0]?.gensetId || selectedGenset) as GensetId
  const usdBtcPrice = btcPrices.usd || 85000

  const fleetTemplate: FleetTemplate = {
    id: fleetId,
    name: MINER_STACK_PRESETS.find(x => x.id === fleetId)?.name || 'Custom fleet',
    sourceTypes: p.source_type ? [p.source_type] : [],
    asicId: selectedASIC.id,
    minerCount: machineCount,
    overclockPercent,
    mode: stackMode,
    gensets: gensetStack,
    assumptions: {
      ...DEFAULT_FLEET_ASSUMPTIONS,
      btcPriceUsd: usdBtcPrice,
      revenuePerThPerDayBtc,
      uptimePct: uptimePercent,
      poolFeePct: poolFeePercent,
      maintenancePct: maintenanceAnnualPercent,
      fixedSetupCostCad,
      powerCostUsdPerKwh,
    },
  }

  const unused = unusedCapacity(siteAsFleet, fleetTemplate, calculations.usedPowerKw)
  const capturedKgPerDay = unused.consumedKgPerDay
  const capturedPct = siteEmission > 0 ? Math.min(100, (capturedKgPerDay / siteEmission) * 100) : 0
  const fullLoadModel = computeFleetModel({ ...modelInput, machineCount: ceilingMiners })
  const unminedUsdPerDay = Math.max(0, fullLoadModel.dailyRevenueFiat - calculations.dailyRevenueFiat)
  const suggestedPreset = fleetPresetForSourceType(p.source_type || '')
  const fleetShareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'}/map?site=${encodeURIComponent(site.id)}&${encodeFleet(fleetTemplate)}`
  const gaugePct = Math.min(100, Math.round((machineCount / Math.max(1, ceilingMiners)) * 100))
  const usedPowerKw = Math.min(calculations.totalPowerKw, calculations.generatorPowerKw)
  const sparePct = Math.max(0, 100 - gaugePct)
  const modeLabel = stackMode === 'auto' ? 'Fill the gas' : 'My build'

  // ---- Cockpit inputs (lib/cockpit.ts is pure + unit-tested) ------------------
  const recency = dataRecencyBadge(p)
  const flux = fluxBadge(p)
  const hashprice = hashpriceRead({
    usedBtcPerThDay: revenuePerThPerDayBtc,
    usdBtcPrice,
    // Honest reference: the network-derived value, NOT the optimistic shipped default.
    networkBtcPerThDay: NETWORK_DERIVED_BTC_PER_TH_DAY,
    asicHashrateThs: selectedASIC.hashrate_ths,
    asicWatts: selectedASIC.power_w,
    powerCostUsdPerKwh,
  })
  const capacity = capacityModel({
    count: machineCount,
    ceilingMiners,
    gasCeilingKw: calculations.generatorPowerKw,
    asicWatts: selectedASIC.power_w,
  })
  const currentPreview = previewFor(machineCount)

  /** Honest hashprice derivation — the two editable network inputs → the reference. */
  const networkDerived = networkHashrateThs > 0 ? networkDailyIssuanceBtc / networkHashrateThs : 0
  const hashpriceDiffPct =
    networkDerived > 0 ? ((revenuePerThPerDayBtc - networkDerived) / networkDerived) * 100 : 0
  const isOptimistic = hashpriceDiffPct > 1

  /** One place that turns a template into "this template at this site" — cards and apply agree. */
  const resolveTemplateForSite = (template: FleetTemplate): FleetTemplate => resolveFleetForSite(template, siteAsFleet)
  const shelfResultFor = (template: FleetTemplate): ShelfResult => {
    const scaled = resolveTemplateForSite(template)
    const asic = ASIC_MACHINES.find(m => m.id === scaled.asicId) || selectedASIC
    const m = computeFleetModel({ ...modelInput, asic, gensets: scaled.gensets, machineCount: scaled.minerCount, overclockPercent: scaled.overclockPercent || 0 })
    return {
      minerCount: m.effectiveMachineCount,
      satsPerDay: satsPerDay(m.effectiveDailyBtc),
      ceilingKw: m.generatorPowerKw,
      template: scaled,
    }
  }

  /**
   * The sales handoff: the fleet link travels into the certified-application form
   * (/partnerships reads it) so one click turns a build into a qualified lead.
   */
  const handoffHref = `/partnerships?category=${encodeURIComponent('Site application')}`
    + `&site=${encodeURIComponent(p.name || site.id)}`
    + `&fleet=${encodeURIComponent(fleetShareUrl)}`

  /** Any manual edit stops the build claiming to be a named template. */
  const setCountManually = (next: number) => {
    setStackMode('manual')
    setFleetId('custom')
    setMachineCount(next)
  }
  const stepMiners = (delta: number) => {
    setCountManually(Math.max(0, Math.min(machineCount + delta, ceilingMiners)))
  }

  const decMiners = () => {
    setStackMode('manual')
    setMachineCount(c => Math.max(0, c - 1))
  }
  const incMiners = () => {
    setStackMode('manual')
    setMachineCount(c => Math.min(c + 1, ceilingMiners))
  }
  const addGensetUnit = () => {
    setGensetStack(prev => {
      if (!prev.length) return [{ gensetId: 'jenbacher316', count: 1 }]
      const next = prev.map(g => ({ ...g }))
      next[0] = { ...next[0], count: Math.max(1, next[0].count) + 1 }
      return next
    })
    // Add installed capacity only. The shared fuel budget may already be exhausted.
    setFleetId('custom')
  }
  const ceilingWithout = (gensetId: GensetId): number => {
    const reduced = gensetStack
      .map(g => (g.gensetId === gensetId ? { ...g, count: g.count - 1 } : { ...g }))
      .filter(g => g.count > 0)
    if (!reduced.length) return 0
    return minerCeiling(siteGasCeilingKw(siteAsFleet, reduced), selectedASIC.power_w)
  }
  const canRemoveGenset = (gensetId: GensetId) => ceilingWithout(gensetId) >= machineCount
  const removeGensetUnit = (gensetId: GensetId) => {
    setGensetStack(prev => {
      const reduced = prev
        .map(g => (g.gensetId === gensetId ? { ...g, count: g.count - 1 } : { ...g }))
        .filter(g => g.count > 0)
      if (!reduced.length) return prev
      return minerCeiling(siteGasCeilingKw(siteAsFleet, reduced), selectedASIC.power_w) >= machineCount ? reduced : prev
    })
  }
  const applyTemplate = (template: FleetTemplate) => {
    const scaled = resolveTemplateForSite(template)
    setGensetStack(scaled.gensets.map(g => ({ ...g })))
    const head = scaled.gensets[0]?.gensetId
    if (head) setSelectedGenset(head)
    const asic = ASIC_MACHINES.find(m => m.id === scaled.asicId)
    if (asic) setSelectedASIC(asic)
    setFleetId(scaled.id)
    setStackMode(scaled.mode)
    setMachineCount(scaled.minerCount)
    setOverclockPercent(scaled.overclockPercent || 0)
    toast.success(`Applied “${scaled.name}” at this site`)
  }

  const saveCurrentAsNamed = () => {
    const name = fleetNameInput.trim()
    if (!name) return
    const rec = saveNamedFleet(name, fleetTemplate)
    if (rec) {
      setNamedFleets(listNamedFleets())
      setShowSaveFleetName(false)
      setFleetNameInput('')
      toast.success(`Saved fleet template "${rec.name}"`)
    } else {
      toast.error('Could not save fleet template')
    }
  }

  // ---- Mobile sections (phone sheet only; desktop keeps the full cockpit) -----
  /** Overview / Build / Financials / Evidence exist only in the bottom sheet. */
  const sectionsEnabled = sheet && !compact
  /**
   * Two jobs in one class string:
   *   - `site-section-<id>` is a permanent marker, so a test (or an audit) can
   *     say which section a block belongs to without reading the JSX;
   *   - `site-section-off` is what actually hides it while another section is
   *     on screen. Nothing is unmounted, so a section switch cannot lose form
   *     state, and on desktop (no sections) neither class is emitted.
   */
  const sectionOff = (id: SiteSectionId) =>
    ` site-section-${id}${sectionsEnabled && section !== id ? ' site-section-off' : ''}`
  const activeSection: SiteSectionId = sectionsEnabled ? section : 'overview'
  const jumpToBuild = () => {
    setSection('build')
    // The thumb bar's "jump to stack" must land on the stack, which lives in Build.
    if (typeof window === 'undefined') return
    window.requestAnimationFrame(() => {
      document.querySelector('[data-testid="miner-stack"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  const selectSection = (id: SiteSectionId, focus = false) => {
    setSection(id)
    if (focus) sectionTabRefs.current[id]?.focus()
    // A section always starts at its top — switching must never drop the reader
    // halfway down the previous section's scroll offset.
    const el = panelScrollRef.current
    if (!el) return
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }
  /** Arrow/Home/End move between tabs, as the tabs pattern expects. */
  const onSectionKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = SITE_SECTIONS.findIndex(s => s.id === activeSection)
    if (i < 0) return
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % SITE_SECTIONS.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + SITE_SECTIONS.length) % SITE_SECTIONS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = SITE_SECTIONS.length - 1
    if (next < 0) return
    e.preventDefault()
    selectSection(SITE_SECTIONS[next].id, true)
  }

  /**
   * The build summary — ONE element, mounted once. On the phone sheet it lives
   * inside the sticky tab strip (persistent while the Build section scrolls); on
   * the docked desktop cockpit it renders as the first block of the panel, right
   * above the builder. Both branches consume the same model outputs as the
   * cockpit and the ROI summary: no number is computed here.
   */
  const buildSummary = (
    <BuildSummary
      variant={sectionsEnabled ? 'sheet' : 'docked'}
      miners={capacity.miners}
      installedMiners={machineCount}
      ceilingMiners={ceilingMiners}
      usedKw={capacity.usedKw}
      availableKw={calculations.generatorPowerKw}
      capexFiat={calculations.totalInvestmentFiat}
      netPerDayFiat={calculations.dailyProfitFiat}
      paybackDays={calculations.paybackDays}
      currencySymbol={currencySymbol}
      fiatCode={selectedFiat}
      optimistic={isOptimistic}
      hashpriceDiffPct={hashpriceDiffPct}
      className={sectionOff('build')}
    />
  )

  return (
    <motion.div
      ref={panelScrollRef}
      initial={{ opacity: 0, x: compact ? 0 : 32, y: compact ? 24 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: compact ? 0 : 24, y: compact ? 16 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`w-full bg-[#1e293b] border border-[#5BC0BE]/30 shadow-xl relative ${compact ? 'rounded-t-2xl p-4' : 'rounded-xl p-4 sm:p-6 max-h-full overflow-y-auto'}`}
      data-testid={compact ? 'mobile-site-peek' : 'site-details-panel'}
    >
      {initialFleet && !compact && (
        <div className="mb-3 rounded-lg border border-[#A78BFA]/40 bg-[#A78BFA]/10 px-3 py-2 text-label text-[#A78BFA] flex items-center gap-2" data-testid="shared-build-banner">
          <Link2 size={13} aria-hidden />
          You're viewing a <span className="font-semibold">shared build</span> — this stack was pre-loaded from a link. Tweak it freely.
        </div>
      )}
      <div className={`flex items-start justify-between ${compact ? 'mb-3 gap-2' : 'mb-3'}`}>
        <div className="min-w-0 flex-1">
          <h2 className={`font-bold text-white truncate ${compact ? 'text-[15px] leading-tight' : 'text-xl'}`}>
            {p.name || 'Unknown'}
          </h2>
          <p className={`text-gray-400 truncate ${compact ? 'text-label mt-0.5' : 'text-sm'}`}>
            {p.city || 'Unknown'},{' '}
            {p.province ? <Link href={`/provinces?name=${encodeURIComponent(p.province)}`} className="hit-area-row text-[#5BC0BE] hover:underline">{p.province}</Link> : ''}
          </p>
          {typeof site.strandedScore === 'number' && (
            <div className={`flex items-center gap-1.5 flex-wrap ${compact ? 'mt-1.5' : 'mt-2'}`}>
              <span className={`stranded-score ${scoreTierClass(site.strandedScore)} ${compact ? 'text-sm' : ''}`}>
                <FormulaTip formulaId="score">{site.strandedScore}</FormulaTip>
              </span>
              <span className={`uppercase tracking-wider text-gray-400 ${compact ? 'text-label' : 'text-label'}`}>{scoreTier(site.strandedScore)}</span>
              {site.scoreBadge && <span className={`text-[#5BC0BE] ${compact ? 'text-label' : 'text-label'}`}>{site.scoreBadge}</span>}
              {dataQuality && <DataQualityBadge report={dataQuality} />}
              {!compact && scoreHistory.length > 1 && <ScoreSparkline values={scoreHistory} />}
            </div>
          )}
          {/* Honesty visuals: where the number comes from, right in the header. */}
          {!compact && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2" data-testid="site-honesty-badges">
              {recency && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-label ${
                    recency.tier === 'high'
                      ? 'border-[#34D399]/45 bg-[#34D399]/10 text-[#34D399]'
                      : recency.tier === 'low'
                        ? 'border-amber-400/45 bg-amber-400/10 text-amber-200'
                        : 'border-[#5BC0BE]/40 bg-[#5BC0BE]/10 text-[#5BC0BE]'
                  }`}
                  title={`Source: ${p.data_source || 'dataset'} · last reported ${p.last_reported_year ?? p.reference_year ?? 'not stated'} · confidence ${p.confidence || 'not stated'}`}
                  data-testid="site-data-recency"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {recency.label} · {recency.detail}
                </span>
              )}
              {flux && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-label ${
                    flux.tone === 'flare'
                      ? 'border-[#FF8C00]/50 bg-[#FF8C00]/10 text-[#FF8C00]'
                      : 'border-amber-400/50 bg-amber-400/10 text-amber-200'
                  }`}
                  data-testid="site-flux-badge"
                >
                  {flux.label}
                </span>
              )}
              {!flux && fluxScopeNotApplicable(p) && (
                <span
                  className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-label text-gray-300"
                  title={FLUX_NO_SPLIT_HINT}
                  data-testid="site-flux-not-reported"
                >
                  {FLUX_NO_SPLIT_LABEL}
                </span>
              )}
              <a
                href="/open-data"
                className="rounded-full border border-white/15 px-2 py-0.5 text-label text-gray-300 hover:border-[#5BC0BE]/50 hover:text-[#5BC0BE]"
                data-testid="site-verify-link"
              >
                Verify this yourself →
              </a>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!compact && (
            <button
              type="button"
              onClick={() => { if (site) { const b = toggleBookmark(site.id); setBookmarked(b) } }}
              className={`text-xs px-2 py-1 rounded border ${bookmarked ? 'border-[#FF8C00] text-[#FF8C00]' : 'border-white/20 text-gray-400'}`}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark site'}
              aria-pressed={bookmarked}
            >{bookmarked ? '★' : '☆'}</button>
          )}
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white h-11 w-11 md:h-6 md:w-6 inline-flex items-center justify-center shrink-0" aria-label="Close site details">✕</button>
        </div>
      </div>

      {compact && (
        <div className="flex items-center gap-2 pt-0.5">
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="flex-1 py-2 text-label font-medium rounded-xl border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
              data-testid="mobile-site-expand"
            >
              {t('sitePeekExpand')}
            </button>
          )}
          {onAddToMission && (
            <button
              type="button"
              onClick={() => onAddToMission(site)}
              className="flex-1 py-2 text-label font-semibold rounded-xl bg-[#FF8C00] text-black hover:bg-orange-400 transition"
            >
              {t('sitePeekMission')}
            </button>
          )}
        </div>
      )}

      {!compact && (
      <>
      {/*
        Phone-sheet section nav. `role="tablist"` with roving tabindex + arrow
        keys; every tab is a >=44px box (globals.css `.site-section-tab`). It
        only exists in the bottom sheet — desktop keeps one continuous cockpit.
      */}
      {/*
        The sticky strip. It holds the section tabs AND — while Build is the
        active section — the build summary, so the summary stays under the thumb
        against the tabs for the whole section instead of scrolling away. One
        sticky box (not two) also means the summary can never leave a gap or a
        strip of content above the nav, and no offset constant has to be kept in
        sync with the tabs' height.
      */}
      {sectionsEnabled && (
        <div className="site-section-sticky" data-testid="site-section-sticky">
          <div
            className="site-section-nav"
            role="tablist"
            aria-label="Site sections"
            data-testid="site-section-nav"
            onKeyDown={onSectionKeyDown}
          >
            {SITE_SECTIONS.map(s => (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`${sectionPanelId}-tab-${s.id}`}
                aria-selected={activeSection === s.id}
                aria-controls={sectionPanelId}
                tabIndex={activeSection === s.id ? 0 : -1}
                ref={el => { sectionTabRefs.current[s.id] = el }}
                className="site-section-tab"
                data-testid={`site-section-tab-${s.id}`}
                onClick={() => selectSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {buildSummary}
        </div>
      )}

      {/* Docked desktop cockpit: no tabs exist, so the summary sits above the builder. */}
      {!sectionsEnabled && buildSummary}

      {/*
        One neutral wrapper so the four sections can share a single tabpanel id.
        It carries no styles: margins collapse through it exactly as before, so
        the docked desktop cockpit is visually unchanged.
      */}
      <div
        id={sectionsEnabled ? sectionPanelId : undefined}
        role={sectionsEnabled ? 'tabpanel' : undefined}
        aria-labelledby={sectionsEnabled ? `${sectionPanelId}-tab-${activeSection}` : undefined}
        /*
          Phone Build only: a one-column flex context so the ASIC / generator
          pickers and the miner stack can be ordered ABOVE the long
          explanatory blocks (`order` needs a flex/grid parent). The class exists
          only on the sheet's Build tab, so every other section — and the whole
          docked desktop cockpit — keeps plain block flow and margin collapsing.
        */
        className={sectionsEnabled && activeSection === 'build' ? 'site-section-body--build-order' : undefined}
        data-testid="site-section-body"
      >
      {/*
        Overview's one obvious next step: it routes to Build, where the miners,
        gensets and presets live. Only the phone sheet has sections, so this
        never appears on the docked desktop cockpit.
      */}
      {sectionsEnabled && (
        <button
          type="button"
          onClick={() => selectSection('build')}
          className={`w-full mb-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#f59e0b] px-3 py-3 text-sm font-semibold text-black active:scale-[0.985] transition${sectionOff('overview')}`}
          data-testid="site-section-cta-build"
        >
          Configure build →
        </button>
      )}
      {/* ---- THE COCKPIT: hero number, capacity bar with the gas ceiling, live readouts ---- */}
      <div className={sectionOff('build')} data-testid="build-cockpit">
      <MinerStackCockpit
        siteId={site.id}
        variant={sectionsEnabled ? 'sheet' : 'docked'}
        machineCount={machineCount}
        onCountChange={setCountManually}
        mode={stackMode}
        onModeChange={setStackMode}
        ceilingMiners={ceilingMiners}
        gasCeilingKw={calculations.generatorPowerKw}
        asic={{ ...selectedASIC, power_w: selectedASIC.power_w * (1 + overclockPercent / 100) * (1 + overclockPercent / 200) }}
        gensets={gensetStack}
        headGensetName={GENSET_DATA[headGenset]?.name || 'generator'}
        headGensetId={headGenset}
        onAddGenset={addGensetUnit}
        onRemoveGenset={(gensetId) => { setFleetId('custom'); removeGensetUnit(gensetId) }}
        canRemoveGenset={canRemoveGenset}
        preview={previewFor}
        currencySymbol={currencySymbol}
        fiatCode={selectedFiat}
        siteEmissionKgDay={siteEmission}
        capturedKgPerDay={capturedKgPerDay}
        unconvertedKgPerDay={unused.unconvertedKgPerDay}
        unusedKgPerDay={unused.unusedKgPerDay}
        unusedUsdPerDay={unminedUsdPerDay}
        hashprice={hashprice}
        powerCostUsdPerKwh={powerCostUsdPerKwh}
        dataYear={Number(p.reference_year) || undefined}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <CopyLinkButton
            url={fleetShareUrl}
            label="Copy fleet link"
            successMessage="Fleet link copied — miners, gensets and mode included"
            className="w-full justify-center"
          />
        </div>
      </MinerStackCockpit>
      </div>

      {/* ---- templates as a shelf, not a form ---- */}
      <div className={sectionOff('build')} data-testid="build-templates">
      <FleetTemplateShelf
        presets={MINER_STACK_PRESETS}
        saved={namedFleets}
        activeId={fleetId}
        suggestedId={suggestedPreset?.id}
        resultFor={shelfResultFor}
        onApply={applyTemplate}
        onDeleteSaved={(id) => { deleteNamedFleet(id); setNamedFleets(listNamedFleets()) }}
        onSaveCurrent={() => setShowSaveFleetName(true)}
        saveOpen={showSaveFleetName}
      />

      {showSaveFleetName && (
        <div className="flex gap-1.5 mt-2" data-testid="miner-stack-save-form">
          <input
            autoFocus
            value={fleetNameInput}
            onChange={e => setFleetNameInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { saveCurrentAsNamed(); } if (e.key === 'Escape') { setShowSaveFleetName(false); setFleetNameInput('') } }}
            placeholder="Template name (e.g. Keele Valley)"
            aria-label="Name for this build"
            className="flex-1 min-w-0 text-label px-2 py-1.5 rounded border border-white/15 bg-black/30 text-white"
          />
          <button
            type="button"
            onClick={saveCurrentAsNamed}
            disabled={!fleetNameInput.trim()}
            className="text-label px-3 py-1.5 rounded border border-[#5BC0BE]/40 text-[#5BC0BE] disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setShowSaveFleetName(false); setFleetNameInput('') }}
            className="text-label px-2 py-1.5 rounded border border-white/15 text-gray-400"
            aria-label="Cancel save"
          >
            ✕
          </button>
        </div>
      )}
      </div>

      {/* ---- one obvious next step: the build becomes a sales handoff ---- */}
      <div className={`mt-3 rounded-2xl border border-[#FF8C00]/35 bg-[#FF8C00]/10 p-3${sectionOff('build')}`} data-testid="send-this-build">
        <div className="text-label text-gray-200 leading-snug">
          This build: <span className="text-white font-semibold tabular-nums">{formatCount(capacity.miners)} miners</span> ·{' '}
          <span className="text-[#5BC0BE] font-semibold tabular-nums">{formatKw(capacity.usedKw)} kW</span> ·{' '}
          <span className="text-[#FF8C00] font-semibold tabular-nums">{formatSats(currentPreview.satsPerDay)} sats/day</span> ·{' '}
          payback <span className="text-white font-semibold tabular-nums">{formatPayback(currentPreview.paybackDays)}</span>
        </div>
        <a
          href={handoffHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#f59e0b] px-3 py-3 text-sm font-semibold text-black active:scale-[0.985] transition"
          data-testid="send-this-build-cta"
        >
          <Send size={15} aria-hidden /> Send this build to the team
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(fleetShareUrl)
                      toast.success('Build link copied — share it anywhere')
                    }}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#5BC0BE]/50 px-3 py-3 text-sm font-semibold text-[#5BC0BE] hover:bg-[#5BC0BE]/10 active:scale-[0.985] transition"
                    data-testid="share-build-cta"
                  >
                    <Link2 size={15} aria-hidden /> Share this build
                  </button>
        <div className="text-label text-gray-400 mt-1.5 leading-snug">
          Opens the certified application with this fleet link pre-filled, category{' '}
          <span className="text-gray-300">Site application</span>, subject{' '}
          <span className="text-gray-300">“Stranded Energy — Site application: {p.name || site.id}”</span>.
        </div>
      </div>

      {scoreExplain && (
        <details className={`mb-4 rounded-lg border border-white/10 bg-black/20 p-3${sectionOff('overview')}`} data-testid="site-score-why" open>
          <summary className="text-sm font-semibold text-[#FF8C00] cursor-pointer">Why this score ({scoreExplain.score})</summary>
          <ul className="mt-2 space-y-1.5 text-xs text-gray-300">
            {scoreExplain.factors.map(f => (
              <li key={f.id} className="flex justify-between gap-2">
                <span>
                  {f.label}
                  {f.inferred && <span className="ml-1 text-label text-amber-400/90">inferred</span>}
                  <span className="block text-label text-gray-400">{f.detail}</span>
                </span>
                <span className="font-mono text-[#5BC0BE] shrink-0">+{f.points}</span>
              </li>
            ))}
          </ul>
          {scoreExplain.notes.length > 0 && (
            <p className="mt-2 text-label text-gray-400 leading-snug">{scoreExplain.notes[0]}</p>
          )}
        </details>
      )}

      {confBand && (
        <div className={`mb-4${sectionOff('overview')}`}>
          <ConfidenceBandBar score={site.strandedScore || confBand.low} low={confBand.low} high={confBand.high} band={confBand.band} reason={confBand.reason} />
        </div>
      )}

      <div className="mb-4 grid gap-3" data-testid="site-metric-grid">
        <div className={sectionOff('overview')}>
          <VerticalScoreGrid scores={verticalScores} />
        </div>
        <p className={`text-label text-gray-500${sectionOff('overview')}`} data-testid="site-carbon-note">
          <FormulaTip formulaId="carbonValue">Carbon (screening)</FormulaTip>
          {': '}
          <span className="font-mono text-[#34D399]">$0/yr</span>
          {' · '}
          <span className="text-gray-400">{carbonBaselineLabel(p as Record<string, unknown>)}</span>
        </p>
        <div className={sectionOff('financials')}>
          <MonteCarloPanel baseDailyUsd={site.potentialDailyProfitUsd || 0} />
        </div>
        <div className={sectionOff('financials')}>
          <GasDeclineChart emissionKgDay={siteEmission} baseDailyUsd={site.potentialDailyProfitUsd || 0} />
        </div>
        <div className={sectionOff('financials')}>
          <CapexFxControls baseCapexUsd={Math.max(250_000, (site.maxGeneratorPowerKW || 500) * 1000)} />
        </div>
        <div className={sectionOff('financials')}>
          <AmortizationTable defaultPrincipal={Math.round(((site.maxGeneratorPowerKW || 500) * 1000) * 0.6)} />
        </div>
        <div className={sectionOff('evidence')}>
          <CaseStudyExport
          site={{
            id: site.id,
            name: p.name,
            province: p.province,
            city: p.city,
            sourceType: p.source_type,
            score: site.strandedScore,
            emissionKgDay: siteEmission,
            gensetKw: site.maxGeneratorPowerKW,
            confidence: p.confidence,
            company: p.company,
            potentialDailyUsd: site.potentialDailyProfitUsd,
            fleet: { template: fleetTemplate, site: siteAsFleet, paybackDays: isFinite(calculations.paybackDays) ? calculations.paybackDays : null },
          }}
          liveBtc={liveBtcPrice}
        />
        </div>
      </div>

      {tornado.length > 0 && (
        <details className={`mb-4 rounded-lg border border-white/10 bg-black/20 p-3${sectionOff('financials')}`}>
          <summary className="text-sm font-semibold text-[#5BC0BE] cursor-pointer">Sensitivity tornado</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {tornado.map(row => (
              <li key={row.param} className="flex justify-between gap-2 text-gray-300">
                <span className="truncate">{row.param}</span>
                <span className="font-mono text-label shrink-0">{row.lowImpact.toFixed(2)} → {row.highImpact.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {peers.length > 0 && (
        <details className={`mb-4 rounded-lg border border-white/10 bg-black/20 p-3${sectionOff('overview')}`} data-testid="site-peers">
          <summary className="text-sm font-semibold text-white cursor-pointer">
            Peers {peerMeta ? `(rank ${peerMeta.rankByScore}/${peers.length + 1} in cohort)` : ''}
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-gray-300">
            {peers.map(peer => (
              <li key={peer.id} className="flex justify-between gap-2">
                <span className="truncate">{peer.properties.name}</span>
                <span className="font-mono text-[#FF8C00] shrink-0">{peer.strandedScore}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className={`mb-4${sectionOff('evidence')}`} data-testid="site-bank-export">
        <div className="text-xs font-semibold text-gray-400 mb-1.5">Bank pack export</div>
        <ExportFormatPicker value={exportFmt} onChange={setExportFmt} className="mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setShowBankPreview(true)} className="text-label px-2 py-1 rounded border border-white/15 hover:border-[#5BC0BE]/50">
            Preview
          </button>
          <button type="button" onClick={() => downloadBankPack(exportFmt)} className="text-label px-2 py-1 rounded border border-[#FF8C00]/40 text-[#FF8C00]">
            Export {exportFmt.toUpperCase()}
          </button>
          <button type="button" onClick={downloadPdf} className="text-label px-2 py-1 rounded border border-[#5BC0BE]/50 text-[#5BC0BE] hover:bg-[#5BC0BE]/10" data-testid="bank-pack-pdf">
            <i className="fa-solid fa-file-pdf mr-1" /> Download PDF
          </button>
          <CopyLinkButton url={mapDeepLink} label="Copy link" successMessage="Site deep link copied" />
          <Link
            href={`/compare?a=${encodeURIComponent(site.id)}`}
            className="text-label px-2 py-1 rounded border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
            data-testid="site-view-compare"
          >
            View on compare
          </Link>
        </div>
      </div>
      <BankPackPreview
        open={showBankPreview}
        onClose={() => setShowBankPreview(false)}
        sites={[site as EnrichedSite]}
        allSites={allSites}
        liveBtcUsd={liveBtcPrice}
        title={`Bank pack — ${p.name || site.id}`}
        fleet={{ template: fleetTemplate, site: siteAsFleet, paybackDays: isFinite(calculations.paybackDays) ? calculations.paybackDays : null }}
      />
      {/* Currency lock-in — BTC is always the denominator; pick the fiat you think in */}
            <div className={`mb-4${sectionOff('financials')}`} data-testid="site-fiat-select">
              <label className="text-sm font-semibold text-[#5BC0BE]">Currency</label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-600 bg-slate-800/60 p-1">
                {FIAT_OPTIONS.filter(f => f.code !== 'JPY' && f.code !== 'GBP').map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleFiatChange(opt.code)}
                    className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${selectedFiat === opt.code ? 'bg-[#FF8C00] text-black' : 'text-gray-300 hover:bg-white/10'}`}
                  >
                    {opt.code}+BTC
                    <span className="block text-[10px] font-normal opacity-70">{opt.name}</span>
                  </button>
                ))}
              </div>
              <div className="text-label text-gray-400 mt-1.5">BTC &amp; sats are always the denominator. This just sets the fiat you read.</div>
            </div>
      <div className={`space-y-2 text-sm mb-4 p-3 bg-slate-800/50 rounded-lg${sectionOff('build')}`} data-testid="site-power-summary">
        <div className="flex justify-between"><span className="text-gray-400">Total Power (ASICs)</span><span className="text-[#5BC0BE]">{calculations.totalPowerKw.toFixed(1)} kW</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Generator Power (from site gas)</span><span className="text-[#FF8C00]">{calculations.generatorPowerKw.toFixed(1)} kW ({calculations.gensetName})</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Hardware Cost</span><span className="text-white">{calculations.hardwareCostBtc.toFixed(6)} BTC <span className="text-xs text-gray-400">({fmt(calculations.hardwareCostFiat)})</span></span></div>
      </div>
      <div className={`mb-4${sectionOff('build')}`} data-testid="site-asic-select">
        <label className="text-sm font-semibold text-[#5BC0BE]">ASIC Model</label>
        <select value={selectedASIC.id} onChange={(e) => setSelectedASIC(ASIC_MACHINES.find(m => m.id === e.target.value) || ASIC_MACHINES[0])} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
          {ASIC_MACHINES.map(m => <option key={m.id} value={m.id}>{m.name} - {m.hashrate_ths} TH/s @ {m.power_w}W</option>)}
        </select>
      </div>
      <div className={`mb-4${sectionOff('build')}`} data-testid="site-genset-select">
        <label className="text-sm font-semibold text-[#5BC0BE]">Generator Model (production side from real site gas)</label>
        <select value={selectedGenset} onChange={(e) => {
          const id = e.target.value as GensetId
          setSelectedGenset(id)
          // one genset model in the stack, keeping the unit count
          setGensetStack(prev => [{ gensetId: id, count: Math.max(1, prev.reduce((s, g) => s + (g.count || 0), 0)) }])
        }} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
          {Object.keys(GENSET_DATA).map(id => <option key={id} value={id}>{GENSET_DATA[id as GensetId].name}</option>)}
        </select>
      </div>
      <div className={`mb-2 text-xs text-gray-400${sectionOff('financials')}`}>Financing for total CapEx (generator + mining hardware)</div>
      <div className={`flex gap-3 mb-4${sectionOff('financials')}`} data-testid="site-financing">
        <div className="flex-1">
          <label className="text-xs">Debt %: {debtPercent}%</label>
          <input type="range" min="0" max="90" value={debtPercent} onChange={e => setDebtPercent(+e.target.value)} className="w-full accent-[#FF8C00]" />
        </div>
        <div className="flex-1">
          <label className="text-xs">Interest: {interestRate}%</label>
          <input type="range" min="3" max="15" step="0.5" value={interestRate} onChange={e => setInterestRate(+e.target.value)} className="w-full accent-[#5BC0BE]" />
        </div>
      </div>
      {advancedRoi && (
        <div className={`mb-4 p-3 bg-[#FF8C00]/10 border border-[#FF8C00]/25 rounded-lg text-xs grid grid-cols-2 gap-2${sectionOff('financials')}`}>
          <div><span className="text-gray-400">LCOE</span><div className="font-mono text-white">${advancedRoi.lcoeUsdPerKwh}/kWh</div></div>
          <div title={carbonBaselineLabel(p as Record<string, unknown>)}><span className="text-gray-400">Carbon (screening)</span><div className="font-mono text-[#34D399]">${advancedRoi.carbonRevenueUsd.toLocaleString()}/yr</div></div>
          <div><span className="text-gray-400">Incentives</span><div className="font-mono text-[#5BC0BE]">${advancedRoi.incentiveGrantUsd.toLocaleString()}</div></div>
          <div><span className="text-gray-400">Jobs</span><div className="font-mono">{advancedRoi.jobs.total} FTE</div></div>
        </div>
      )}
      <div className={`mb-4 p-3 bg-slate-800/40 rounded-lg${sectionOff('financials')}`}>
        <RoiProjectionChart dailyBtc={calculations.effectiveDailyBtc} btcUsd={btcPrice} />
      </div>
      <div className={sectionOff('evidence')}>
        <PinProof
          siteName={site?.properties?.name ?? null}
          rowId={site?.id ?? null}
          className="mb-4"
        />
      </div>
      <div className={sectionOff('evidence')}>
        <TadbuyAdHook siteId={site?.id} />
      </div>
      <div className={`mb-3 flex gap-2 text-label${sectionOff('evidence')}`}>
        <a href={integrationUrl('sherpacarta', site?.id)} target="_blank" rel="noopener noreferrer" className="hit-area-row justify-center flex-1 text-center py-1.5 rounded border border-white/15 hover:border-[#5BC0BE]/40 text-gray-400 hover:text-[#5BC0BE]">Legal via Sherpacarta</a>
      </div>
      <div className={`mb-3${sectionOff('financials')}`}>
        <label className="text-xs text-gray-400">Gas treatment derate: {(gasTreatmentDerate * 100).toFixed(0)}%</label>
        <input type="range" min="0.7" max="1" step="0.01" value={gasTreatmentDerate} onChange={e => setGasTreatmentDerate(+e.target.value)} className="w-full accent-[#5BC0BE]" />
        <GeneratorDerateChart emissionKgDay={siteEmission} gensetId={selectedGenset} className="mt-3" />
      </div>
      <div className={`bg-[#5BC0BE]/10 border border-[#5BC0BE]/30 rounded-lg p-4 mb-4${sectionOff('financials')}`} data-testid="site-roi-summary">
        <h3 className="text-[#5BC0BE] font-bold mb-2">ROI Summary <span className="text-xs font-normal">(BTC first — always the denominator)</span></h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Daily BTC Earned (after pool)</span><span className="text-white">{calculations.effectiveDailyBtc.toFixed(6)} BTC</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Daily Revenue</span><span className="text-green-400 font-semibold">{calculations.dailyRevenueBtc.toFixed(6)} BTC <span className="text-xs text-gray-400">({fmt(calculations.dailyRevenueFiat)})</span></span></div>
          <div className="flex justify-between"><span className="text-gray-400">Power Cost</span><span className="text-red-400">{calculations.dailyPowerCostBtc.toFixed(6)} BTC <span className="text-xs text-gray-400">({fmt(calculations.dailyPowerCostFiat)})</span></span></div>
          <div className="flex justify-between"><span className="text-gray-400">Daily Maintenance</span><span className="text-red-400">{calculations.dailyMaintBtc.toFixed(6)} BTC <span className="text-xs text-gray-400">({fmt(calculations.dailyMaintFiat)})</span></span></div>
          <div className="flex justify-between border-t border-slate-600 pt-2"><span className="text-gray-400">Daily Profit (net)</span><span className={`font-bold ${calculations.dailyProfitBtc >= 0 ? 'text-green-400' : 'text-red-400'}`}>{calculations.dailyProfitBtc.toFixed(6)} BTC <span className="text-xs text-gray-400">({fmt(calculations.dailyProfitFiat)})</span></span></div>
          <div className="flex justify-between"><span className="text-gray-400">Monthly Profit (net)</span><span className={`font-bold ${calculations.monthlyProfitBtc >= 0 ? 'text-green-400' : 'text-red-400'}`}>{calculations.monthlyProfitBtc.toFixed(6)} BTC <span className="text-xs text-gray-400">({fmt(calculations.monthlyProfitFiat)})</span></span></div>

          <div className="flex justify-between mt-2 pt-2 border-t border-slate-600">
            <span className="text-gray-400">Hardware (variable)</span>
            <span className="text-white">{calculations.hardwareCostBtc.toFixed(4)} BTC <span className="text-xs text-gray-400">({fmt(calculations.hardwareCostFiat)})</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">+ Fixed Setup (one-time)</span>
            <span className="text-white">{calculations.fixedCostBtc.toFixed(4)} BTC <span className="text-xs text-gray-400">({fmt(calculations.fixedCostFiat)})</span></span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-gray-300">Total Investment</span>
            <span>{calculations.totalInvestmentBtc.toFixed(4)} BTC <span className="text-xs text-gray-400">({fmt(calculations.totalInvestmentFiat)})</span></span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">+ Generator CapEx ({calculations.gensetName})</span>
            <span className="text-white">{calculations.gensetCapexBtc.toFixed(4)} BTC</span>
          </div>

          <div className="flex justify-between mt-2 pt-2 border-t border-slate-600">
            <span className="text-gray-400">Payback (Total Capital)</span>
            <span className={calculations.paybackDays < 365 ? 'text-green-400' : 'text-yellow-400'}>{isFinite(calculations.paybackDays) ? Math.round(calculations.paybackDays) + ' days' : 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Financed Payback ({debtPercent}% debt @ {interestRate}%)</span>
            <span className="text-gray-300">{isFinite(calculations.financedPaybackDays) ? Math.round(calculations.financedPaybackDays) + ' days' : 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Marginal Payback (per extra machine)</span>
            <span className="text-gray-300">{isFinite(calculations.marginalPayback) ? Math.round(calculations.marginalPayback) + ' days' : 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs mt-1 border-t border-slate-700 pt-1">
            <span className="text-red-400">Methane Loss (daily BTC if vented)</span>
            <span className="text-red-400">{calculations.methaneLossDailyBtc.toFixed(4)} BTC</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Financed Payback (after debt cost)</span>
            <span className="text-gray-300">{isFinite(calculations.financedPaybackDays) ? Math.round(calculations.financedPaybackDays) + ' days' : 'N/A'}</span>
          </div>
        </div>
      </div>
      {/* Instant Bear/Base/Bull scenario strip — one tap re-runs the whole card */}
      <div className={`mb-4 rounded-xl border border-white/10 bg-gradient-to-r from-red-500/5 via-[#FF8C00]/5 to-green-500/5 p-3${sectionOff('financials')}`} data-testid="scenario-strip">
        <div className="text-label text-gray-400 mb-1.5">Market scenario — instantly re-runs every number on this card</div>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(SCENARIO) as ('bear' | 'base' | 'bull')[]).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => setScenario(id)}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${scenario === id ? `${id === 'bear' ? 'bg-red-500/80' : id === 'bull' ? 'bg-green-500/80' : 'bg-[#FF8C00]'} text-black` : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
            >
              {SCENARIO[id].label}
              <span className="block text-[10px] font-normal opacity-70">{selectedFiat} {SCENARIO[id].btc >= 1 ? '+' : ''}{Math.round((SCENARIO[id].btc - 1) * 100)}%</span>
            </button>
          ))}
        </div>
        {scenario !== 'base' && (
          <div className="text-label mt-1.5 text-amber-300/90">Showing a <span className="font-semibold">{scenarioMul.label}</span> scenario — daily profit, payback and sats all reflect it.</div>
        )}
      </div>
      <button onClick={() => setAdvancedMode(!advancedMode)} data-testid="site-advanced-toggle" className={`w-full py-2 mb-4 text-[#5BC0BE] text-sm border border-[#5BC0BE]/30 rounded-lg hover:bg-[#5BC0BE]/10 transition-colors${sectionOff('financials')}`}>{advancedMode ? 'Hide Advanced' : 'Show Advanced'}</button>
      {advancedMode && (
        <div className={`space-y-4 mb-4 p-4 bg-slate-800/30 rounded-lg text-sm${sectionOff('financials')}`} data-testid="site-advanced-panel">
          <div>
            <label className="text-xs text-gray-400">Miners: {machineCount.toLocaleString()} of {ceilingMiners.toLocaleString()} the gas supports</label>
            <input type="range" min="1" max={Math.max(10000, ceilingMiners)} value={Math.min(machineCount, Math.max(10000, ceilingMiners))} onChange={(e) => { setStackMode('manual'); setMachineCount(Number(e.target.value)) }} className="w-full mt-2 accent-[#5BC0BE]" />
            <div className="text-label text-gray-400 mt-0.5">Sliding this switches to “My build”. Extra equipment only helps if gas remains; unsupported miners earn nothing.</div>
          </div>
          <div>
            <label className="text-xs text-gray-400">BTC Price in {selectedFiat} (live default, editable)</label>
            <input 
              type="number" 
              value={btcPrice} 
              onChange={(e) => setBtcPrice(Number(e.target.value))} 
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" 
            />
          </div>

          <div>
            <label className="text-xs text-gray-400">Historical BTC backtest (USD, 0 = use live)</label>
            <input type="number" value={historicalBtcUsd || ''} placeholder={String(liveBtcPrice)} onChange={e => setHistoricalBtcUsd(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Difficulty multiplier: {difficultyMultiplier.toFixed(2)}×</label>
            <input type="range" min="0.5" max="1.5" step="0.05" value={difficultyMultiplier} onChange={e => setDifficultyMultiplier(+e.target.value)} className="w-full accent-[#FF8C00]" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Revenue per TH/s / day (BTC) — your assumption, editable</label>
            <input type="number" step="0.0000001" value={revenuePerThPerDayBtc} onChange={(e) => setRevenuePerThPerDayBtc(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
            <div className={`text-label mt-1 ${isOptimistic ? 'text-amber-300' : 'text-[#34D399]'}`}>
              Network-derived: <span className="tabular-nums">{networkDerived.toFixed(10)}</span> BTC/TH/day ·{' '}
              <span className="tabular-nums">{hashpriceDiffPct >= 0 ? '+' : ''}{hashpriceDiffPct.toFixed(0)}%</span> {isOptimistic ? 'above network — optimistic scenario' : 'in line with / below network'}
            </div>
            <div className="text-label text-gray-400 mt-1 grid grid-cols-2 gap-2">
              <label className="text-gray-500">Network hashrate (TH/s)
                <input type="number" step="10000000" value={networkHashrateThs} onChange={(e) => setNetworkHashrateThs(Number(e.target.value))} className="w-full mt-0.5 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white tabular-nums" />
              </label>
              <label className="text-gray-500">BTC issuance/day (subsidy+fees)
                <input type="number" step="10" value={networkDailyIssuanceBtc} onChange={(e) => setNetworkDailyIssuanceBtc(Number(e.target.value))} className="w-full mt-0.5 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white tabular-nums" />
              </label>
            </div>
            <div className="text-label text-gray-400 mt-1.5">Hashprice = network BTC issuance ÷ network hashrate. It moves with price and difficulty; we show both ends rather than claiming one. The shipped default of {NETWORK_ESTIMATE_BTC_PER_TH_DAY.toFixed(7)} is an <span className="text-amber-300">optimistic scenario</span>, not a neutral estimate.</div>
          </div>

          <div>
            <label className="text-xs text-gray-400">Power cost (USD/kWh) — editable</label>
            <input type="number" step="0.005" min="0" value={powerCostUsdPerKwh} onChange={(e) => setPowerCostUsdPerKwh(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
            <div className="text-label text-gray-400 mt-1">
              A stranded-gas site burns gas with no fuel cost — its electricity-equivalent is O&amp;M only.
            </div>
            <button
              type="button"
              onClick={() => setPowerCostUsdPerKwh(0.015)}
              className="mt-1.5 text-label px-2 py-1 rounded border border-[#34D399]/40 text-[#34D399] hover:bg-[#34D399]/10"
              data-testid="preset-stranded-gas-power"
            >
              Stranded gas (O&amp;M only) ≈ 0.015
            </button>
            {calculations && (
              <div className="text-label text-gray-400 mt-1.5" data-testid="power-cost-before-after">
                Payback: <span className="tabular-nums text-white">{formatPayback(defaultPowerPaybackDays ?? Infinity)}</span> at {DEFAULT_POWER_COST_USD_PER_KWH.toFixed(2)}/kWh →{' '}
                <span className={`tabular-nums ${powerCostUsdPerKwh < DEFAULT_POWER_COST_USD_PER_KWH ? 'text-[#34D399]' : 'text-white'}`}>{formatPayback(calculations.paybackDays)}</span> at {powerCostUsdPerKwh.toFixed(3)}/kWh
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400">Overclock %</label>
            <input type="range" min="0" max="50" value={overclockPercent} onChange={(e) => setOverclockPercent(Number(e.target.value))} className="w-full mt-1 accent-[#FF8C00]" />
            <div className="text-right text-xs text-gray-400">+{overclockPercent}%</div>
          </div>

          <div className="pt-2 border-t border-slate-700 space-y-3">
            <div>
              <label className="text-xs text-gray-400">Fixed Setup Cost ({selectedFiat}) — one-time (permitting, generator base, install, etc.)</label>
              <input type="number" value={Math.round(cadToFiat(fixedSetupCostCad))} onChange={(e) => setFixedSetupCostCad(fiatToCad(Number(e.target.value)))} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
            </div>

            <div>
              <label className="text-xs text-gray-400">Pool Fee %</label>
              <input type="range" min="0" max="5" step="0.1" value={poolFeePercent} onChange={(e) => setPoolFeePercent(Number(e.target.value))} className="w-full mt-1 accent-[#FF8C00]" />
              <div className="text-right text-xs text-gray-400">{poolFeePercent}%</div>
            </div>

            <div>
              <label className="text-xs text-gray-400">Annual Maintenance % of Hardware Cost</label>
              <input type="range" min="0" max="15" step="0.5" value={maintenanceAnnualPercent} onChange={(e) => setMaintenanceAnnualPercent(Number(e.target.value))} className="w-full mt-1 accent-[#FF8C00]" />
              <div className="text-right text-xs text-gray-400">{maintenanceAnnualPercent}% / year</div>
            </div>
          </div>

          <div className="text-label text-gray-400 pt-2 border-t border-slate-700">
            These advanced inputs make the model more realistic. Fixed costs mean payback improves with scale. All values are estimates only — see disclaimer below.
          </div>
        </div>
      )}

      <div className={`mb-3${sectionOff('evidence')}`} data-testid="site-notes">
        <label className="text-xs text-gray-400">Site notes (saved locally)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={() => site && setSiteNote(site.id, note)} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-xs h-16" placeholder="Due diligence notes…" />
      </div>
      <details className={`mt-1 mb-2${sectionOff('evidence')}`} data-testid="site-raw-properties">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">All raw properties from dataset ({Object.keys(p).length} fields)</summary>
        <pre className="text-label mt-1 p-2 bg-black/40 rounded overflow-auto max-h-44 text-gray-300 whitespace-pre-wrap break-all">{JSON.stringify(p, null, 2)}</pre>
      </details>
      </div>
      {/* ---- end of the section body (Overview / Build / Financials / Evidence) ---- */}

      {onAddToMission && (
        <button
          onClick={() => onAddToMission(site)}
          className="mt-2 w-full py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#f59e0b] text-black active:scale-[0.985] transition flex items-center justify-center gap-2"
        >
          + ADD TO MISSION PORTFOLIO
        </button>
      )}

      <div className="flex gap-2 mt-2">
        <button 
                  onClick={() => {
                    const summary = buildRoiSummary();
                    navigator.clipboard.writeText(summary);
                    toast.success('ROI summary copied')
                  }}
          className="flex-1 py-2 text-xs border border-[#5BC0BE]/30 rounded-lg hover:bg-[#5BC0BE]/10"
        >
          Copy ROI Summary
        </button>
        <button
          type="button"
          onClick={() => {
            const mapUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'}/map?site=${site.id}`
            const note = [
              `🛢️ Stranded Value — ${p.name || site.id}`,
              `${p.province} · Score ${site.strandedScore} · ${site.emission.toLocaleString()} kg CH₄/day`,
              `Stranded methane → Bitcoin. Zero grid.`,
              mapUrl,
              '#bitcoin #methane #strandedenergy',
            ].join('\n')
            navigator.clipboard.writeText(note)
            trackCategory('share', 'nostr-draft', { siteId: site.id })
            toast.success('Nostr note draft copied')
          }}
          className="flex-1 py-2 text-xs border border-[#A78BFA]/40 rounded-lg hover:bg-[#A78BFA]/10 text-[#A78BFA]"
        >
          Nostr draft
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700 text-label text-gray-400 leading-snug">
        <strong>Important Honesty Note:</strong> This is a simplified model for educational purposes only. 
        Real Bitcoin mining revenue varies constantly with network difficulty, transaction fees, hardware degradation, 
        actual gas composition, weather, maintenance downtime, and local regulations. Power costs, hardware prices, 
        and BTC price are highly volatile. Fixed costs are an estimate. Do not use these numbers for actual investment decisions without independent verification and professional advice. 
        Past or modeled performance is not a guarantee of future results.
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">v0.5 • GiveAbit Intelligence — live BTC price shown in selected currency. All values BTC-first.</p>

      {/* Mobile bottom sheet: thumb-zone controls for the miner stack. */}
      {sheet && (
        <MinerStackThumbBar
          count={capacity.miners}
          ceilingMiners={ceilingMiners}
          filledPct={capacity.filledPct}
          usedKw={capacity.usedKw}
          gasCeilingKw={calculations.generatorPowerKw}
          satsPerDay={currentPreview.satsPerDay}
          onStep={stepMiners}
          onJumpToStack={jumpToBuild}
        />
      )}
      </>
      )}
    </motion.div>
  )
}
