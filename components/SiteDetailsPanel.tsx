'use client'

import { useState, useMemo, useEffect } from 'react'
import { GENSET_DATA, computeGeneratorPower, GensetId, EnrichedSite } from '@/lib/sites'
import { computeAdvancedRoi } from '@/lib/roi-model'
import { toggleBookmark, getBookmarks, getSiteNote, setSiteNote } from '@/lib/bookmarks'
import Link from 'next/link'
import RoiProjectionChart from '@/components/RoiProjectionChart'
import { integrationUrl } from '@/lib/integrations'
import { explainStrandedScore, scoreTierClass, scoreTier } from '@/lib/scoring'
import { findPeerSites, peerSummary } from '@/lib/peers'
import { sensitivityTornado } from '@/lib/sensitivity'
import { bankPackMarkdown, bankPackCsv, bankPackTsv, bankPackHtml, bankPackJson } from '@/lib/bank-pack'
import { downloadBlob } from '@/lib/export-formats'

const ASIC_MACHINES = [
  { id: 's21xp', name: 'Antminer S21 XP', hashrate_ths: 300, power_w: 4050, efficiency_j_th: 13.5, cost_cad: 8500, manufacturer: 'Bitmain' },
  { id: 's21', name: 'Antminer S21', hashrate_ths: 200, power_w: 3500, efficiency_j_th: 17.5, cost_cad: 5500, manufacturer: 'Bitmain' },
  { id: 's19kpro', name: 'Antminer S19k Pro', hashrate_ths: 136, power_w: 3264, efficiency_j_th: 24.0, cost_cad: 3200, manufacturer: 'Bitmain' },
  { id: 's19xp', name: 'Antminer S19 XP', hashrate_ths: 140, power_w: 3010, efficiency_j_th: 21.5, cost_cad: 3800, manufacturer: 'Bitmain' },
  { id: 'm50s', name: 'WhatsMiner M50S++', hashrate_ths: 150, power_w: 3276, efficiency_j_th: 21.8, cost_cad: 3600, manufacturer: 'MicroBT' },
  { id: 'm60s', name: 'WhatsMiner M60S', hashrate_ths: 186, power_w: 3348, efficiency_j_th: 18.0, cost_cad: 4800, manufacturer: 'MicroBT' },
  { id: 't21', name: 'Antminer T21', hashrate_ths: 190, power_w: 3610, efficiency_j_th: 19.0, cost_cad: 4200, manufacturer: 'Bitmain' },
  { id: 's19apro', name: 'Antminer S19a Pro', hashrate_ths: 110, power_w: 3250, efficiency_j_th: 29.5, cost_cad: 2400, manufacturer: 'Bitmain' },
  { id: 'm30s', name: 'WhatsMiner M30S++', hashrate_ths: 112, power_w: 3472, efficiency_j_th: 31.0, cost_cad: 2200, manufacturer: 'MicroBT' },
  { id: 's19', name: 'Antminer S19', hashrate_ths: 95, power_w: 3250, efficiency_j_th: 34.2, cost_cad: 1800, manufacturer: 'Bitmain' }
]

const FIAT_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
] as const

type FiatCode = typeof FIAT_OPTIONS[number]['code']
type BtcPriceMap = Record<Lowercase<FiatCode>, number>

export default function SiteDetailsPanel({ 
  site, 
  onClose, 
  onAddToMission, 
  liveBtcPrice = 85000,
  allSites = [],
}: { 
  site: any
  onClose: () => void
  onAddToMission?: (site: any) => void
  liveBtcPrice?: number
  allSites?: EnrichedSite[]
}) {
  const p = site?.properties || {}
  const siteEmission = p.emission_rate_kg_day || 0

  const [selectedFiat, setSelectedFiat] = useState<FiatCode>('USD')
  const [btcPrices, setBtcPrices] = useState<BtcPriceMap>({ usd: 85000, eur: 78000, jpy: 12500000, gbp: 65000, cad: 115000 })
  const [selectedASIC, setSelectedASIC] = useState(ASIC_MACHINES[0])
  const [machineCount, setMachineCount] = useState(100)
  const [overclockPercent, setOverclockPercent] = useState(0)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [btcPrice, setBtcPrice] = useState(85000) // Price of 1 BTC in the *selected* fiat (BTC is always the base)
  const [uptimePercent, setUptimePercent] = useState(95)

  // Generator integration for real per-site Value (CapEx on production side)
  const [selectedGenset, setSelectedGenset] = useState<GensetId>('jenbacher316')
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

  useEffect(() => {
    if (!site) return
    setBookmarked(getBookmarks().includes(site.id))
    setNote(getSiteNote(site.id))
  }, [site?.id])

  const currentFiat = FIAT_OPTIONS.find(f => f.code === selectedFiat) || FIAT_OPTIONS[0]
  const currencySymbol = currentFiat.symbol

  // Fetch live BTC prices for top 5 fiats (BTC always the denominator)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,jpy,gbp,cad')
        const data = await res.json()
        if (data?.bitcoin) {
          const prices = {
            usd: data.bitcoin.usd || 85000,
            eur: data.bitcoin.eur || 78000,
            jpy: data.bitcoin.jpy || 12500000,
            gbp: data.bitcoin.gbp || 65000,
            cad: data.bitcoin.cad || 115000,
          }
          setBtcPrices(prices)
          // Use current selectedFiat at fetch time
          const key = selectedFiat.toLowerCase() as Lowercase<FiatCode>
          const live = prices[key] || prices.usd
          setBtcPrice(live)
        }
      } catch (_) {}
    }
    fetchPrices()
  }, [selectedFiat]) // re-fetch if fiat changes before initial load (rare)

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

    // Generator integration: limit power from site's real emission using chosen genset
    const generatorPowerKw = computeGeneratorPower(siteEmission, selectedGenset)
    const effectivePowerKw = Math.min(totalPowerKw, generatorPowerKw)
    const effectiveMachineCount = Math.min(machineCount, Math.floor(generatorPowerKw * 1000 / selectedASIC.power_w ))

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

    // Generator CapEx (production side, real from dataset)
    const gensetCapexCad = GENSET_DATA[selectedGenset].powerKW * GENSET_DATA[selectedGenset].capexPerKW
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
      gensetName: GENSET_DATA[selectedGenset].name
    }
  }, [selectedASIC, machineCount, overclockPercent, btcPrice, uptimePercent, selectedFiat, btcPrices, fixedSetupCostCad, poolFeePercent, maintenanceAnnualPercent, revenuePerThPerDayBtc, selectedGenset, debtPercent, interestRate, siteEmission])

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

  return (
    <div className="w-full bg-[#1e293b]/95 backdrop-blur border border-[#5BC0BE]/30 rounded-xl p-6 shadow-xl max-w-md max-h-full overflow-y-auto relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{p.name || 'Unknown'}</h2>
          <p className="text-sm text-gray-400">
            {p.city || 'Unknown'},{' '}
            {p.province ? <Link href={`/provinces?name=${encodeURIComponent(p.province)}`} className="text-[#5BC0BE] hover:underline">{p.province}</Link> : ''}
          </p>
          {typeof site.strandedScore === 'number' && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`stranded-score ${scoreTierClass(site.strandedScore)}`}>{site.strandedScore}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">{scoreTier(site.strandedScore)}</span>
              {site.scoreBadge && <span className="text-[10px] text-[#5BC0BE]">{site.scoreBadge}</span>}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if (site) { const b = toggleBookmark(site.id); setBookmarked(b) } }} className={`text-xs px-2 py-1 rounded border ${bookmarked ? 'border-[#FF8C00] text-[#FF8C00]' : 'border-white/20 text-gray-400'}`}>{bookmarked ? '★' : '☆'}</button>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
      </div>

      {scoreExplain && (
        <details className="mb-4 rounded-lg border border-white/10 bg-black/20 p-3" open>
          <summary className="text-sm font-semibold text-[#FF8C00] cursor-pointer">Why this score ({scoreExplain.score})</summary>
          <ul className="mt-2 space-y-1.5 text-xs text-gray-300">
            {scoreExplain.factors.map(f => (
              <li key={f.id} className="flex justify-between gap-2">
                <span>
                  {f.label}
                  {f.inferred && <span className="ml-1 text-[9px] text-amber-400/90">inferred</span>}
                  <span className="block text-[10px] text-gray-500">{f.detail}</span>
                </span>
                <span className="font-mono text-[#5BC0BE] shrink-0">+{f.points}</span>
              </li>
            ))}
          </ul>
          {scoreExplain.notes.length > 0 && (
            <p className="mt-2 text-[10px] text-gray-500 leading-snug">{scoreExplain.notes[0]}</p>
          )}
        </details>
      )}

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
        <div className="flex flex-wrap gap-1.5">
          {([
            ['md', 'MD'],
            ['csv', 'CSV'],
            ['tsv', 'Excel TSV'],
            ['html', 'Print/PDF'],
            ['json', 'JSON'],
          ] as const).map(([fmt, label]) => (
            <button
              key={fmt}
              type="button"
              onClick={() => downloadBankPack(fmt)}
              className="text-[10px] px-2 py-1 rounded border border-white/15 hover:border-[#FF8C00]/50 hover:text-[#FF8C00]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
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
      <div className="mb-4">
        <label className="text-sm font-semibold text-[#5BC0BE]">ASIC Model</label>
        <select value={selectedASIC.id} onChange={(e) => setSelectedASIC(ASIC_MACHINES.find(m => m.id === e.target.value) || ASIC_MACHINES[0])} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
          {ASIC_MACHINES.map(m => <option key={m.id} value={m.id}>{m.name} - {m.hashrate_ths} TH/s @ {m.power_w}W</option>)}
        </select>
      </div>
      <div className="mb-4">
        <label className="text-sm font-semibold text-[#5BC0BE]">Machines: {machineCount.toLocaleString()} (capped by generator power: {calculations.generatorPowerKw.toFixed(0)} kW from site gas)</label>
        <input type="range" min="1" max="10000" value={machineCount} onChange={(e) => setMachineCount(Number(e.target.value))} className="w-full mt-2 accent-[#5BC0BE]" />
      </div>

      {/* Generator integration + Financing for real CapEx / methane loss ROI */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-[#5BC0BE]">Generator Model (production side from real site gas)</label>
        <select value={selectedGenset} onChange={(e) => setSelectedGenset(e.target.value as GensetId)} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
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
      <div className="mb-3 flex gap-2 text-[10px]">
        <a href={integrationUrl('tadbuy', site?.id)} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 rounded border border-white/15 hover:border-[#FF8C00]/40 text-gray-400 hover:text-[#FF8C00]">ASICs via Tadbuy</a>
        <a href={integrationUrl('sherpacarta', site?.id)} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 rounded border border-white/15 hover:border-[#5BC0BE]/40 text-gray-400 hover:text-[#5BC0BE]">Legal via Sherpacarta</a>
      </div>
      <div className="mb-3">
        <label className="text-xs text-gray-400">Gas treatment derate: {(gasTreatmentDerate * 100).toFixed(0)}%</label>
        <input type="range" min="0.7" max="1" step="0.01" value={gasTreatmentDerate} onChange={e => setGasTreatmentDerate(+e.target.value)} className="w-full accent-[#5BC0BE]" />
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
            <div className="text-[10px] text-gray-500 mt-0.5">This is the key honest variable. Adjust based on real hashprice data.</div>
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

          <div className="text-[10px] text-gray-500 pt-2 border-t border-slate-700">
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
            // Simple toast via alert for now (sonner global)
            alert('ROI summary copied!');
          }}
          className="flex-1 py-2 text-xs border border-[#5BC0BE]/30 rounded-lg hover:bg-[#5BC0BE]/10"
        >
          Copy ROI Summary
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700 text-[10px] text-gray-500 leading-snug">
        <strong>Important Honesty Note:</strong> This is a simplified model for educational purposes only. 
        Real Bitcoin mining revenue varies constantly with network difficulty, transaction fees, hardware degradation, 
        actual gas composition, weather, maintenance downtime, and local regulations. Power costs, hardware prices, 
        and BTC price are highly volatile. Fixed costs are an estimate. Do not use these numbers for actual investment decisions without independent verification and professional advice. 
        Past or modeled performance is not a guarantee of future results.
      </div>

      <p className="text-xs text-gray-500 text-center mt-3">v0.5 • GiveAbit Intelligence — live BTC price shown in selected currency. All values BTC-first.</p>
    </div>
  )
}
