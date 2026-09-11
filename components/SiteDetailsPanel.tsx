'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { motion } from 'framer-motion'
import ExportFormatPicker, { type ExportFormat } from '@/components/ExportFormatPicker'
import BankPackPreview from '@/components/BankPackPreview'
import CopyLinkButton from '@/components/CopyLinkButton'
import { useLocale } from '@/lib/useLocale'
import { assessSiteDataQuality } from '@/lib/data-quality'
import { scoreConfidenceBand } from '@/lib/score-confidence'
import { computeVerticalScores } from '@/lib/vertical-scores'
import { avoidedMethaneValue } from '@/lib/carbon-overlay'
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
  capFleetToSite,
  encodeFleet,
  fleetPresetForSourceType,
  minerCeiling,
  referenceSiteForPreset,
  rescaleToSite,
  siteGasCeilingKw,
  unusedCapacity,
  type FleetGenset,
  type FleetSite,
  type FleetTemplate,
} from '@/lib/fleet-template'

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

export default function SiteDetailsPanel({ 
  site, 
  onClose, 
  onAddToMission, 
  liveBtcPrice = 85000,
  allSites = [],
  compact = false,
  onExpand,
  initialFleet = null,
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
}) {
  const { t } = useLocale()
  const p = site?.properties || {}
  const siteEmission = p.emission_rate_kg_day || 0

  const { fiats: sharedFiats } = useBtcPrice()
  const [selectedFiat, setSelectedFiat] = useState<FiatCode>('USD')
  const [btcPrices, setBtcPrices] = useState<BtcPriceMap>({ usd: 85000, eur: 78000, jpy: 12500000, gbp: 65000, cad: 115000 })
  const [selectedASIC, setSelectedASIC] = useState(
    () => ASIC_MACHINES.find(m => m.id === initialFleet?.asicId) || ASIC_MACHINES[0],
  )
  const [machineCount, setMachineCount] = useState(() => {
    if (initialFleet) return Math.max(1, initialFleet.minerCount || 1)
    return 100
  })
  const [overclockPercent, setOverclockPercent] = useState(0)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [btcPrice, setBtcPrice] = useState(85000) // Price of 1 BTC in the *selected* fiat (BTC is always the base)
  const [uptimePercent, setUptimePercent] = useState(95)

  // Generator integration for real per-site Value (CapEx on production side)
  const [selectedGenset, setSelectedGenset] = useState<GensetId>(
    () => initialFleet?.gensets?.[0]?.gensetId || 'jenbacher316',
  )
  /** Miner-stack genset inventory — the gas ceiling is the sum of these units */
  const [gensetStack, setGensetStack] = useState<FleetGenset[]>(() =>
    initialFleet?.gensets?.length
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

  // Advanced parameters for more honest modeling
  const [fixedSetupCostCad, setFixedSetupCostCad] = useState(25000) // One-time site prep, generator base, install, etc.
  const [poolFeePercent, setPoolFeePercent] = useState(1.5)
  const [maintenanceAnnualPercent, setMaintenanceAnnualPercent] = useState(5)
  const [revenuePerThPerDayBtc, setRevenuePerThPerDayBtc] = useState(0.0000009)
  const [gasTreatmentDerate, setGasTreatmentDerate] = useState(1.0)
  const [historicalBtcUsd, setHistoricalBtcUsd] = useState(0)
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1.0)
  const [bookmarked, setBookmarked] = useState(false)
  const [note, setNote] = useState('')
  const [scoreHistory, setScoreHistory] = useState<number[]>([])
  const [exportFmt, setExportFmt] = useState<ExportFormat>('md')
  const [showBankPreview, setShowBankPreview] = useState(false)

  useEffect(() => {
    if (!site) return
    setBookmarked(getBookmarks().includes(site.id))
    setNote(getSiteNote(site.id))
    if (typeof site.strandedScore === 'number') {
      recordScoreVisit(site.id, site.strandedScore)
      setScoreHistory(getScoreHistory(site.id))
    }
  }, [site])

  const currentFiat = FIAT_OPTIONS.find(f => f.code === selectedFiat) || FIAT_OPTIONS[0]
  const currencySymbol = currentFiat.symbol

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
    const live = btcPrices[newFiat.toLowerCase() as Lowercase<FiatCode>]
    if (live) setBtcPrice(live)
  }

  const calculations = useMemo(() => {
    if (!site) return null
    const overclockMultiplier = 1 + (overclockPercent / 100)
    const adjustedHashrate = selectedASIC.hashrate_ths * overclockMultiplier
    const adjustedPower = selectedASIC.power_w * overclockMultiplier * (1 + overclockPercent / 200)
    const totalPowerKw = (adjustedPower * machineCount) / 1000

    // Generator integration: limit power from site's real emission using the genset stack (gas ceiling)
    const generatorPowerKw = siteGasCeilingKw(site, gensetStack)
    const effectivePowerKw = Math.min(totalPowerKw, generatorPowerKw)
    const effectiveMachineCount = Math.min(machineCount, minerCeiling(generatorPowerKw, selectedASIC.power_w))

    // Honest revenue: use editable per-TH/day BTC rate (accounts for current difficulty, fees, etc.)
    const dailyBtcGross = adjustedHashrate * effectiveMachineCount * revenuePerThPerDayBtc
    const dailyBtcAfterPool = dailyBtcGross * (1 - poolFeePercent / 100)
    const effectiveDailyBtc = dailyBtcAfterPool * (uptimePercent / 100)

    const btcPriceInFiat = btcPrice

    const dailyRevenueBtc = effectiveDailyBtc
    const dailyRevenueFiat = effectiveDailyBtc * btcPriceInFiat

    // Power cost: base assumption 0.04 in USD/kWh, converted via BTC rates for honesty across currencies
    const powerCostUsd = effectivePowerKw * 24 * 0.04
    const usdBtcPrice = btcPrices.usd || 85000
    const dailyPowerCostBtc = powerCostUsd / usdBtcPrice
    const dailyPowerCostFiat = dailyPowerCostBtc * btcPriceInFiat

    // Maintenance as annual % of hardware investment (realistic opex)
    const cadBtcPrice = btcPrices.cad || 115000
    const hardwareCostBtc = (selectedASIC.cost_cad * effectiveMachineCount) / cadBtcPrice
    const hardwareCostFiat = hardwareCostBtc * btcPriceInFiat
    const dailyMaintBtc = hardwareCostBtc * (maintenanceAnnualPercent / 100) / 365
    const dailyMaintFiat = dailyMaintBtc * btcPriceInFiat

    const dailyProfitBtc = dailyRevenueBtc - dailyPowerCostBtc - dailyMaintBtc
    const dailyProfitFiat = dailyProfitBtc * btcPriceInFiat

    // Generator CapEx (production side, real from dataset) — summed across the genset stack
    const gensetCapexCad = gensetStack.reduce((sum, g) => {
      const spec = GENSET_DATA[g.gensetId]
      if (!spec) return sum
      return sum + spec.powerKW * spec.capexPerKW * Math.max(0, Math.floor(g.count || 0))
    }, 0)
    const gensetCapexBtc = gensetCapexCad / cadBtcPrice
    const gensetCapexFiat = gensetCapexBtc * btcPriceInFiat

    // Fixed setup costs (site prep, base generator, permitting, shipping, install) — do NOT scale linearly with every ASIC
    const fixedCostBtc = fixedSetupCostCad / cadBtcPrice
    const fixedCostFiat = fixedCostBtc * btcPriceInFiat
    const totalInvestmentBtc = hardwareCostBtc + fixedCostBtc + gensetCapexBtc
    const totalInvestmentFiat = hardwareCostFiat + fixedCostFiat + gensetCapexFiat

    // Payback now correctly uses TOTAL investment (fixed + variable + generator). 
    const paybackDays = dailyProfitBtc > 0 ? totalInvestmentBtc / dailyProfitBtc : Infinity

    // Marginal payback (for one additional machine, ignoring fixed) — for transparency
    const marginalDailyProfitBtc = (adjustedHashrate * revenuePerThPerDayBtc * (1 - poolFeePercent / 100) * (uptimePercent / 100)) 
      - (adjustedPower / 1000 * 24 * 0.04 / usdBtcPrice) 
      - ( (selectedASIC.cost_cad / cadBtcPrice) * (maintenanceAnnualPercent / 100) / 365 )
    const marginalPayback = marginalDailyProfitBtc > 0 ? (selectedASIC.cost_cad / cadBtcPrice) / marginalDailyProfitBtc : Infinity

    // Methane loss opportunity cost (the daily profit you lose by venting instead of capturing)
    const maxPossibleDailyBtc = (generatorPowerKw * 1000 / selectedASIC.power_w ) * selectedASIC.hashrate_ths * revenuePerThPerDayBtc * (1 - poolFeePercent / 100) * (uptimePercent / 100)
    const maxPossibleDailyProfitBtc = maxPossibleDailyBtc - (generatorPowerKw * 24 * 0.04 / usdBtcPrice) - ( (selectedASIC.cost_cad / cadBtcPrice) * (maintenanceAnnualPercent / 100) / 365 ) - (gensetCapexBtc / 365)
    const methaneLossDailyBtc = maxPossibleDailyBtc

    // Financing for CapEx (debt % at interest, simple annual cost)
    const debtAmount = totalInvestmentBtc * (debtPercent / 100)
    const annualFinancingCostBtc = debtAmount * (interestRate / 100) * 0.2 // approx 5yr amort factor
    const financedPaybackDays = (dailyProfitBtc - annualFinancingCostBtc) > 0 ? totalInvestmentBtc / (dailyProfitBtc - annualFinancingCostBtc) : Infinity

    return { 
      effectiveDailyBtc: effectiveDailyBtc || 0,
      dailyRevenueBtc: dailyRevenueBtc || 0,
      dailyRevenueFiat: dailyRevenueFiat || 0,
      dailyPowerCostBtc: dailyPowerCostBtc || 0,
      dailyPowerCostFiat: dailyPowerCostFiat || 0,
      dailyMaintBtc: dailyMaintBtc || 0,
      dailyMaintFiat: dailyMaintFiat || 0,
      dailyProfitBtc: dailyProfitBtc || 0,
      dailyProfitFiat: dailyProfitFiat || 0,
      monthlyProfitBtc: (dailyProfitBtc * 30) || 0,
      monthlyProfitFiat: (dailyProfitFiat * 30) || 0,
      hardwareCostBtc: hardwareCostBtc || 0,
      hardwareCostFiat: hardwareCostFiat || 0,
      fixedCostBtc: fixedCostBtc || 0,
      fixedCostFiat: fixedCostFiat || 0,
      totalInvestmentBtc: totalInvestmentBtc || 0,
      totalInvestmentFiat: totalInvestmentFiat || 0,
      paybackDays: paybackDays,
      marginalPayback: marginalPayback,
      totalPowerKw: totalPowerKw || 0,
      generatorPowerKw: generatorPowerKw || 0,
      gensetCapexBtc: gensetCapexBtc || 0,
      methaneLossDailyBtc: methaneLossDailyBtc || 0,
      financedPaybackDays: financedPaybackDays,
      effectiveMachineCount: effectiveMachineCount || 0,
      gensetName: gensetStackLabel(gensetStack)
    }
  }, [selectedASIC, machineCount, overclockPercent, btcPrice, uptimePercent, btcPrices, fixedSetupCostCad, poolFeePercent, maintenanceAnnualPercent, revenuePerThPerDayBtc, gensetStack, debtPercent, interestRate, siteEmission, site])

  // Auto mode: the miner stack always fills the gas ceiling (maximum capture)
  useEffect(() => {
    if (stackMode !== 'auto') return
    const ceiling = minerCeiling(siteGasCeilingKw(site, gensetStack), selectedASIC.power_w)
    if (ceiling > 0) setMachineCount(ceiling)
  }, [stackMode, gensetStack, selectedASIC, site])

  const fmt = (val: number) => {
    if (!isFinite(val) || isNaN(val)) return currencySymbol + '0.00'
    if (val >= 1e6) return currencySymbol + (val/1e6).toFixed(2) + 'M'
    if (val >= 1e3) return currencySymbol + (val/1e3).toFixed(1) + 'K'
    return currencySymbol + val.toFixed(2)
  }

  const fmtBtc = (val: number) => {
    if (!isFinite(val) || isNaN(val)) return '0.000000'
    return val.toFixed(6)
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
  const carbonValue = useMemo(
    () => avoidedMethaneValue(siteEmission, 50, 28),
    [siteEmission],
  )

  if (!site || !calculations) return null

  const downloadBankPack = (fmt: 'md' | 'csv' | 'tsv' | 'html' | 'json') => {
    const sites = [site as EnrichedSite]
    const base = `stranded-bank-pack-${(p.name || site.id || 'site').toString().replace(/[^\w-]+/g, '_').slice(0, 40)}`
    if (fmt === 'md') downloadBlob(bankPackMarkdown(sites, allSites, { liveBtcUsd: liveBtcPrice }), `${base}.md`, 'text/markdown')
    else if (fmt === 'csv') downloadBlob(bankPackCsv(sites, { liveBtcUsd: liveBtcPrice }), `${base}.csv`, 'text/csv')
    else if (fmt === 'tsv') downloadBlob(bankPackTsv(sites, { liveBtcUsd: liveBtcPrice }), `${base}.tsv`, 'text/tab-separated-values')
    else if (fmt === 'html') {
      const w = window.open('', '_blank')
      if (w) { w.document.write(bankPackHtml(sites, { liveBtcUsd: liveBtcPrice })); w.document.close() }
    } else downloadBlob(JSON.stringify(bankPackJson(sites, { liveBtcUsd: liveBtcPrice }), null, 2), `${base}.json`, 'application/json')
  }

  const mapDeepLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'}/map?site=${site.id}`

  // ---- Editable miner stack (fleet template) ----------------------------------
  const siteAsFleet: FleetSite = site as FleetSite
  const ceilingMiners = minerCeiling(calculations.generatorPowerKw, selectedASIC.power_w)
  const atGasCeiling = ceilingMiners > 0 && machineCount >= ceilingMiners
  const headGenset = (gensetStack[0]?.gensetId || selectedGenset) as GensetId
  const usdBtcPrice = btcPrices.usd || 85000

  const fleetTemplate: FleetTemplate = {
    id: fleetId,
    name: MINER_STACK_PRESETS.find(x => x.id === fleetId)?.name || 'Custom fleet',
    sourceTypes: p.source_type ? [p.source_type] : [],
    asicId: selectedASIC.id,
    minerCount: machineCount,
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
    },
  }

  const unused = unusedCapacity(siteAsFleet, fleetTemplate)
  const capturedKgPerDay = Math.max(0, siteEmission - unused.unusedKgPerDay)
  const capturedPct = siteEmission > 0 ? Math.min(100, (capturedKgPerDay / siteEmission) * 100) : 0
  const unminedUsdPerDay =
    (unused.unusedKw / selectedASIC.power_w) *
    selectedASIC.hashrate_ths *
    revenuePerThPerDayBtc *
    usdBtcPrice *
    (1 - poolFeePercent / 100)
  const suggestedPreset = fleetPresetForSourceType(p.source_type || '')
  const fleetShareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io'}/map?site=${encodeURIComponent(site.id)}&${encodeFleet(fleetTemplate)}`
  const gaugePct = Math.min(100, Math.round((machineCount / Math.max(1, ceilingMiners)) * 100))
  const usedPowerKw = Math.min(calculations.totalPowerKw, calculations.generatorPowerKw)
  const sparePct = Math.max(0, 100 - gaugePct)
  const modeLabel = stackMode === 'auto' ? 'Fill the gas' : 'My build'

  const decMiners = () => {
    setStackMode('manual')
    setMachineCount(c => Math.max(1, c - 1))
  }
  const incMiners = () => {
    setStackMode('manual')
    setMachineCount(c => (ceilingMiners > 0 ? Math.min(c + 1, ceilingMiners) : c + 1))
  }
  const addGensetUnit = () => {
    setGensetStack(prev => {
      if (!prev.length) return [{ gensetId: 'jenbacher316', count: 1 }]
      const next = prev.map(g => ({ ...g }))
      next[0] = { ...next[0], count: Math.max(1, next[0].count) + 1 }
      return next
    })
    // the tap the ceiling blocked: one more miner, now that the ceiling has risen
    setMachineCount(c => c + 1)
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
    const reference = referenceSiteForPreset(template, allSites)
    const scaled = capFleetToSite(reference ? rescaleToSite(template, reference, siteAsFleet) : template, siteAsFleet)
    setGensetStack(scaled.gensets.map(g => ({ ...g })))
    const head = scaled.gensets[0]?.gensetId
    if (head) setSelectedGenset(head)
    const asic = ASIC_MACHINES.find(m => m.id === scaled.asicId)
    if (asic) setSelectedASIC(asic)
    setFleetId(scaled.id)
    setStackMode(scaled.mode)
    if (scaled.mode === 'manual') setMachineCount(Math.max(1, scaled.minerCount || 1))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: compact ? 0 : 32, y: compact ? 24 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: compact ? 0 : 24, y: compact ? 16 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`w-full bg-[#1e293b]/95 backdrop-blur border border-[#5BC0BE]/30 shadow-xl max-w-md relative ${compact ? 'rounded-t-2xl p-4' : 'rounded-xl p-6 max-h-full overflow-y-auto'}`}
      data-testid={compact ? 'mobile-site-peek' : 'site-details-panel'}
    >
      <div className={`flex items-start justify-between ${compact ? 'mb-3 gap-2' : 'mb-4'}`}>
        <div className="min-w-0 flex-1">
          <h2 className={`font-bold text-white truncate ${compact ? 'text-[15px] leading-tight' : 'text-xl'}`}>
            {p.name || 'Unknown'}
          </h2>
          <p className={`text-gray-400 truncate ${compact ? 'text-[11px] mt-0.5' : 'text-sm'}`}>
            {p.city || 'Unknown'},{' '}
            {p.province ? <Link href={`/provinces?name=${encodeURIComponent(p.province)}`} className="text-[#5BC0BE] hover:underline">{p.province}</Link> : ''}
          </p>
          {typeof site.strandedScore === 'number' && (
            <div className={`flex items-center gap-1.5 flex-wrap ${compact ? 'mt-1.5' : 'mt-2'}`}>
              <span className={`stranded-score ${scoreTierClass(site.strandedScore)} ${compact ? 'text-sm' : ''}`}>
                <FormulaTip formulaId="score">{site.strandedScore}</FormulaTip>
              </span>
              <span className={`uppercase tracking-wider text-gray-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{scoreTier(site.strandedScore)}</span>
              {site.scoreBadge && <span className={`text-[#5BC0BE] ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{site.scoreBadge}</span>}
              {dataQuality && <DataQualityBadge report={dataQuality} />}
              {!compact && scoreHistory.length > 1 && <ScoreSparkline values={scoreHistory} />}
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
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close site details">✕</button>
        </div>
      </div>

      {compact && (
        <div className="flex items-center gap-2 pt-0.5">
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="flex-1 py-2 text-[11px] font-medium rounded-xl border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
              data-testid="mobile-site-expand"
            >
              {t('sitePeekExpand')}
            </button>
          )}
          {onAddToMission && (
            <button
              type="button"
              onClick={() => onAddToMission(site)}
              className="flex-1 py-2 text-[11px] font-semibold rounded-xl bg-[#FF8C00] text-black hover:bg-orange-400 transition"
            >
              {t('sitePeekMission')}
            </button>
          )}
        </div>
      )}

      {!compact && (
      <>
      {scoreExplain && (
        <details className="mb-4 rounded-lg border border-white/10 bg-black/20 p-3" open>
          <summary className="text-sm font-semibold text-[#FF8C00] cursor-pointer">Why this score ({scoreExplain.score})</summary>
          <ul className="mt-2 space-y-1.5 text-xs text-gray-300">
            {scoreExplain.factors.map(f => (
              <li key={f.id} className="flex justify-between gap-2">
                <span>
                  {f.label}
                  {f.inferred && <span className="ml-1 text-[9px] text-amber-400/90">inferred</span>}
                  <span className="block text-[10px] text-gray-400">{f.detail}</span>
                </span>
                <span className="font-mono text-[#5BC0BE] shrink-0">+{f.points}</span>
              </li>
            ))}
          </ul>
          {scoreExplain.notes.length > 0 && (
            <p className="mt-2 text-[10px] text-gray-400 leading-snug">{scoreExplain.notes[0]}</p>
          )}
        </details>
      )}

      {confBand && (
        <div className="mb-4">
          <ConfidenceBandBar score={site.strandedScore || confBand.low} low={confBand.low} high={confBand.high} band={confBand.band} reason={confBand.reason} />
        </div>
      )}

      <div className="mb-4 grid gap-3">
        <VerticalScoreGrid scores={verticalScores} />
        <p className="text-[10px] text-gray-500">
          <FormulaTip formulaId="carbonValue">Carbon abatement @ $50/t</FormulaTip>
          {': '}
          <span className="font-mono text-[#34D399]">${carbonValue.toLocaleString()}/yr</span>
          {' · '}
          <FormulaTip formulaId="co2e">GWP100=28</FormulaTip>
        </p>
        <MonteCarloPanel baseDailyCad={site.potentialDailyProfitCAD || 0} />
        <GasDeclineChart emissionKgDay={siteEmission} baseDailyCad={site.potentialDailyProfitCAD || 0} />
        <CapexFxControls baseCapexUsd={Math.max(250_000, (site.maxGeneratorPowerKW || 500) * 1000)} />
        <AmortizationTable defaultPrincipal={Math.round(((site.maxGeneratorPowerKW || 500) * 1000) * 0.6)} />
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
            potentialDailyCad: site.potentialDailyProfitCAD,
          }}
          liveBtc={liveBtcPrice}
        />
      </div>

      {tornado.length > 0 && (
        <details className="mb-4 rounded-lg border border-white/10 bg-black/20 p-3">
          <summary className="text-sm font-semibold text-[#5BC0BE] cursor-pointer">Sensitivity tornado</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {tornado.map(row => (
              <li key={row.param} className="flex justify-between gap-2 text-gray-300">
                <span className="truncate">{row.param}</span>
                <span className="font-mono text-[10px] shrink-0">{row.lowImpact.toFixed(2)} → {row.highImpact.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {peers.length > 0 && (
        <details className="mb-4 rounded-lg border border-white/10 bg-black/20 p-3">
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

      <div className="mb-4">
        <div className="text-xs font-semibold text-gray-400 mb-1.5">Bank pack export</div>
        <ExportFormatPicker value={exportFmt} onChange={setExportFmt} className="mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setShowBankPreview(true)} className="text-[10px] px-2 py-1 rounded border border-white/15 hover:border-[#5BC0BE]/50">
            Preview
          </button>
          <button type="button" onClick={() => downloadBankPack(exportFmt)} className="text-[10px] px-2 py-1 rounded border border-[#FF8C00]/40 text-[#FF8C00]">
            Export {exportFmt.toUpperCase()}
          </button>
          <CopyLinkButton url={mapDeepLink} label="Copy link" successMessage="Site deep link copied" />
          <Link
            href={`/compare?a=${encodeURIComponent(site.id)}`}
            className="text-[10px] px-2 py-1 rounded border border-[#5BC0BE]/40 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
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
      />
      {/* Currency dropdown - BTC always the base/denominator */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-[#5BC0BE]">BTC Price in</label>
        <select 
          value={selectedFiat} 
          onChange={(e) => handleFiatChange(e.target.value as FiatCode)}
          className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
        >
          {FIAT_OPTIONS.map(opt => (
            <option key={opt.code} value={opt.code}>{opt.code} ({opt.symbol}) — {opt.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2 text-sm mb-4 p-3 bg-slate-800/50 rounded-lg">
        <div className="flex justify-between"><span className="text-gray-400">Total Power (ASICs)</span><span className="text-[#5BC0BE]">{calculations.totalPowerKw.toFixed(1)} kW</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Generator Power (from site gas)</span><span className="text-[#FF8C00]">{calculations.generatorPowerKw.toFixed(1)} kW ({calculations.gensetName})</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Hardware Cost</span><span className="text-white">{calculations.hardwareCostBtc.toFixed(6)} BTC <span className="text-xs text-gray-400">({fmt(calculations.hardwareCostFiat)})</span></span></div>
      </div>
      {/* ---- Miner stack: add/subtract miners at this location ---- */}
      <div className="mb-4 rounded-lg border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-3" data-testid="miner-stack">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-semibold text-[#FF8C00]">Miner stack</span>
          <div className="flex rounded-lg overflow-hidden border border-white/15" role="group" aria-label="Miner stack mode">
            <button
              type="button"
              onClick={() => setStackMode('auto')}
              aria-pressed={stackMode === 'auto'}
              title="Miners fill the gas ceiling — maximum methane capture"
              className={`px-2 py-1 text-[11px] ${stackMode === 'auto' ? 'bg-[#FF8C00] text-black font-semibold' : 'text-gray-300'}`}
              data-testid="miner-stack-auto"
            >
              Fill the gas
            </button>
            <button
              type="button"
              onClick={() => setStackMode('manual')}
              aria-pressed={stackMode === 'manual'}
              title="Keep your own miner count"
              className={`px-2 py-1 text-[11px] ${stackMode === 'manual' ? 'bg-[#5BC0BE] text-black font-semibold' : 'text-gray-300'}`}
              data-testid="miner-stack-manual"
            >
              My build
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={decMiners}
            aria-label="Remove one miner"
            className="h-12 w-12 min-w-[44px] min-h-[44px] rounded-xl border border-white/20 text-white text-2xl leading-none hover:bg-[#5BC0BE]/20 active:scale-95 transition"
            data-testid="miner-stack-dec"
          >
            −
          </button>
          <div className="min-w-[5.5rem] text-center">
            <div className="text-2xl font-bold text-white font-mono" data-testid="miner-stack-count">
              {machineCount.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400">miners · {modeLabel}</div>
          </div>
          <button
            type="button"
            onClick={incMiners}
            aria-label="Add one miner"
            className="h-12 w-12 min-w-[44px] min-h-[44px] rounded-xl border border-[#FF8C00]/50 text-[#FF8C00] text-2xl leading-none hover:bg-[#FF8C00]/20 active:scale-95 transition"
            data-testid="miner-stack-inc"
          >
            +
          </button>
        </div>

        <div className="text-center text-[11px] text-gray-400 mt-1">
          {selectedASIC.name} · {selectedASIC.hashrate_ths} TH/s @ {selectedASIC.power_w} W
        </div>

        {/* Capacity gauge — filled = your miners, amber = spare gas on the table */}
        <div className="mt-3">
          <div className="flex justify-between gap-2 text-[10px] text-gray-300">
            <span className="font-mono" data-testid="miner-stack-gauge-label">
              {machineCount.toLocaleString()} / {ceilingMiners.toLocaleString()} miners · {usedPowerKw.toLocaleString(undefined, { maximumFractionDigits: 0 })} kW of {calculations.generatorPowerKw.toLocaleString(undefined, { maximumFractionDigits: 0 })} kW
            </span>
            <span className="truncate text-gray-400" title={gensetStackLabel(gensetStack)}>
              {gensetStackLabel(gensetStack)}
            </span>
          </div>
          <div
            className="h-2.5 w-full rounded bg-white/10 mt-1 overflow-hidden flex"
            role="progressbar"
            aria-valuenow={gaugePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${machineCount} of ${ceilingMiners} miners, gas ceiling`}
          >
            <div className="h-full bg-[#5BC0BE]" style={{ width: `${gaugePct}%` }} />
            {sparePct > 0 && <div className="h-full bg-amber-400/80" style={{ width: `${sparePct}%` }} />}
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
            <span>■ your miners</span>
            <span>{sparePct > 0 ? `▨ spare gas (${sparePct}%)` : 'no spare gas'}</span>
          </div>
        </div>

        {atGasCeiling && (
          <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-2 flex-wrap" data-testid="miner-stack-gas-limit">
            <span>{stackMode === 'manual' ? 'Gas limit reached —' : 'Full capture —'}</span>
            <button
              type="button"
              onClick={addGensetUnit}
              className="rounded-full border border-amber-400/60 px-2 py-1 font-semibold hover:bg-amber-400/10"
              data-testid="miner-stack-add-genset"
            >
              + Add another {GENSET_DATA[headGenset]?.name}
            </button>
          </div>
        )}

        {stackMode === 'manual' && machineCount < ceilingMiners && siteEmission > 0 && (
          <div className="mt-2 text-[11px] text-amber-400 leading-snug" data-testid="miner-stack-venting">
            Venting left on the table: {unused.unusedKgPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/day (
            {unused.unusedTPerYear.toLocaleString(undefined, { maximumFractionDigits: 1 })} t/yr CH₄) ≈ ${unminedUsdPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day unmined
          </div>
        )}

        {/* Genset inventory — stack units to raise the ceiling */}
        <div className="mt-3 space-y-1" data-testid="miner-stack-gensets">
          {gensetStack.map(g => (
            <div key={g.gensetId} className="flex items-center justify-between gap-2 text-[11px] text-gray-300">
              <span className="truncate">{g.count} × {GENSET_DATA[g.gensetId]?.name}</span>
              <button
                type="button"
                onClick={() => removeGensetUnit(g.gensetId)}
                disabled={!canRemoveGenset(g.gensetId)}
                title={canRemoveGenset(g.gensetId) ? 'Remove one unit' : 'Remove miners first — they need this unit'}
                aria-label={`Remove one ${GENSET_DATA[g.gensetId]?.name}`}
                className="h-6 w-6 shrink-0 rounded border border-white/20 text-gray-300 disabled:opacity-30"
              >
                −
              </button>
            </div>
          ))}
        </div>

        {/* Live readouts — every tap updates these on the same render tick */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex justify-between"><span className="text-gray-400">Miners</span><span className="text-white font-mono">{machineCount.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Total power</span><span className="text-[#5BC0BE] font-mono">{calculations.totalPowerKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Sats/day</span><span className="text-[#FF8C00] font-mono">{Math.round(calculations.effectiveDailyBtc * 1e8).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">CH₄ captured</span><span className="text-[#34D399] font-mono">{capturedKgPerDay.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/d ({capturedPct.toFixed(0)}%)</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Payback</span><span className="text-white font-mono">{isFinite(calculations.paybackDays) ? Math.round(calculations.paybackDays).toLocaleString() + ' d' : 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Ceiling</span><span className="text-gray-300 font-mono">{ceilingMiners.toLocaleString()}</span></div>
        </div>

        {suggestedPreset && (
          <button
            type="button"
            onClick={() => applyTemplate(suggestedPreset)}
            className="mt-3 w-full text-left text-[10px] px-2 py-1.5 rounded border border-[#5BC0BE]/30 text-[#5BC0BE] hover:bg-[#5BC0BE]/10"
            data-testid="miner-stack-preset"
          >
            Apply template: {suggestedPreset.name} · {gensetStackLabel(suggestedPreset.gensets)}
          </button>
        )}

        <div className="mt-3 flex">
          <CopyLinkButton
            url={fleetShareUrl}
            label="Copy fleet link"
            successMessage="Fleet link copied — miners, gensets and mode included"
            className="w-full justify-center"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-semibold text-[#5BC0BE]">ASIC Model</label>
        <select value={selectedASIC.id} onChange={(e) => setSelectedASIC(ASIC_MACHINES.find(m => m.id === e.target.value) || ASIC_MACHINES[0])} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
          {ASIC_MACHINES.map(m => <option key={m.id} value={m.id}>{m.name} - {m.hashrate_ths} TH/s @ {m.power_w}W</option>)}
        </select>
      </div>
      <div className="mb-4">
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
      <div className="mb-2 text-xs text-gray-400">Financing for total CapEx (generator + mining hardware)</div>
      <div className="flex gap-3 mb-4">
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
        <div className="mb-4 p-3 bg-[#FF8C00]/10 border border-[#FF8C00]/25 rounded-lg text-xs grid grid-cols-2 gap-2">
          <div><span className="text-gray-400">LCOE</span><div className="font-mono text-white">${advancedRoi.lcoeUsdPerKwh}/kWh</div></div>
          <div><span className="text-gray-400">Carbon credits</span><div className="font-mono text-[#34D399]">${advancedRoi.carbonRevenueUsd.toLocaleString()}/yr</div></div>
          <div><span className="text-gray-400">Incentives</span><div className="font-mono text-[#5BC0BE]">${advancedRoi.incentiveGrantUsd.toLocaleString()}</div></div>
          <div><span className="text-gray-400">Jobs</span><div className="font-mono">{advancedRoi.jobs.total} FTE</div></div>
        </div>
      )}
      <div className="mb-4 p-3 bg-slate-800/40 rounded-lg">
        <RoiProjectionChart dailyBtc={calculations.effectiveDailyBtc} btcUsd={btcPrice} />
      </div>
      <TadbuyAdHook siteId={site?.id} />
      <div className="mb-3 flex gap-2 text-[10px]">
        <a href={integrationUrl('sherpacarta', site?.id)} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 rounded border border-white/15 hover:border-[#5BC0BE]/40 text-gray-400 hover:text-[#5BC0BE]">Legal via Sherpacarta</a>
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-400">Gas treatment derate: {(gasTreatmentDerate * 100).toFixed(0)}%</label>
        <input type="range" min="0.7" max="1" step="0.01" value={gasTreatmentDerate} onChange={e => setGasTreatmentDerate(+e.target.value)} className="w-full accent-[#5BC0BE]" />
        <GeneratorDerateChart emissionKgDay={siteEmission} gensetId={selectedGenset} className="mt-3" />
      </div>
      <div className="bg-[#5BC0BE]/10 border border-[#5BC0BE]/30 rounded-lg p-4 mb-4">
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
      <button onClick={() => setAdvancedMode(!advancedMode)} className="w-full py-2 mb-4 text-[#5BC0BE] text-sm border border-[#5BC0BE]/30 rounded-lg hover:bg-[#5BC0BE]/10 transition-colors">{advancedMode ? 'Hide Advanced' : 'Show Advanced'}</button>
      {advancedMode && (
        <div className="space-y-4 mb-4 p-4 bg-slate-800/30 rounded-lg text-sm">
          <div>
            <label className="text-xs text-gray-400">Miners: {machineCount.toLocaleString()} of {ceilingMiners.toLocaleString()} the gas supports</label>
            <input type="range" min="1" max={Math.max(10000, ceilingMiners)} value={Math.min(machineCount, Math.max(10000, ceilingMiners))} onChange={(e) => { setStackMode('manual'); setMachineCount(Number(e.target.value)) }} className="w-full mt-2 accent-[#5BC0BE]" />
            <div className="text-[10px] text-gray-400 mt-0.5">Sliding this switches the stack to “My build”. The ceiling only rises when you add a genset.</div>
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
            <label className="text-xs text-gray-400">Revenue per TH/s / day (BTC) — current network estimate</label>
            <input type="number" step="0.0000001" value={revenuePerThPerDayBtc} onChange={(e) => setRevenuePerThPerDayBtc(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
            <div className="text-[10px] text-gray-400 mt-0.5">This is the key honest variable. Adjust based on real hashprice data.</div>
          </div>

          <div>
            <label className="text-xs text-gray-400">Overclock %</label>
            <input type="range" min="0" max="50" value={overclockPercent} onChange={(e) => setOverclockPercent(Number(e.target.value))} className="w-full mt-1 accent-[#FF8C00]" />
            <div className="text-right text-xs text-gray-400">+{overclockPercent}%</div>
          </div>

          <div className="pt-2 border-t border-slate-700 space-y-3">
            <div>
              <label className="text-xs text-gray-400">Fixed Setup Cost (CAD) — one-time (permitting, generator base, install, etc.)</label>
              <input type="number" value={fixedSetupCostCad} onChange={(e) => setFixedSetupCostCad(Number(e.target.value))} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white" />
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

          <div className="text-[10px] text-gray-400 pt-2 border-t border-slate-700">
            These advanced inputs make the model more realistic. Fixed costs mean payback improves with scale. All values are estimates only — see disclaimer below.
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="text-xs text-gray-400">Site notes (saved locally)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={() => site && setSiteNote(site.id, note)} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-xs h-16" placeholder="Due diligence notes…" />
      </div>
      <details className="mt-1 mb-2">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-200">All raw properties from dataset ({Object.keys(p).length} fields)</summary>
        <pre className="text-[10px] mt-1 p-2 bg-black/40 rounded overflow-auto max-h-44 text-gray-300 whitespace-pre-wrap break-all">{JSON.stringify(p, null, 2)}</pre>
      </details>

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
            const summary = `Site: ${p.name} (${p.province})\nDaily Profit: ${fmt(calculations.dailyProfitFiat)}\nMonthly: ${fmt(calculations.monthlyProfitFiat)}\nPayback: ${isFinite(calculations.paybackDays) ? Math.round(calculations.paybackDays) + ' days' : 'N/A'}\nBTC Price used: $${Math.round(liveBtcPrice)}`;
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

      <div className="mt-4 pt-3 border-t border-slate-700 text-[10px] text-gray-400 leading-snug">
        <strong>Important Honesty Note:</strong> This is a simplified model for educational purposes only. 
        Real Bitcoin mining revenue varies constantly with network difficulty, transaction fees, hardware degradation, 
        actual gas composition, weather, maintenance downtime, and local regulations. Power costs, hardware prices, 
        and BTC price are highly volatile. Fixed costs are an estimate. Do not use these numbers for actual investment decisions without independent verification and professional advice. 
        Past or modeled performance is not a guarantee of future results.
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">v0.5 • GiveAbit Intelligence — live BTC price shown in selected currency. All values BTC-first.</p>
      </>
      )}
    </motion.div>
  )
}
