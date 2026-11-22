'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Flame, Zap, Cpu, Box, Bitcoin, Landmark, ArrowRight, CheckCircle2 } from 'lucide-react'
import { GENSET_DATA, type GensetId, computeGeneratorPower } from '@/lib/sites'
import { ASIC_MACHINES } from '@/lib/fleet-template'
import { NETWORK_DERIVED_BTC_PER_TH_DAY, NETWORK_ESTIMATE_BTC_PER_TH_DAY } from '@/lib/fleet-model'
import { CAPTURE_HUT_SPECS, sizeCaptureHutsForBuild, type GasConditioningPackage } from '@/lib/capture-huts'
import { useBtcPrice } from '@/components/BtcPriceProvider'

const PRESET_SITES = [
  { id: 'G12147', label: 'Enbridge Distribution (ON · #1 Mega · 39,072 kg/d)', kgDay: 39072, source: 'oil_gas_extraction', genset: 'man' as GensetId },
  { id: 'G10365', label: 'Essex-Windsor Landfill (ON · #2 Mega · 32,544 kg/d)', kgDay: 32544, source: 'landfill_waste', genset: 'man' as GensetId },
  { id: 'G10115', label: 'Fording River Coal (BC · 34,657 kg/d)', kgDay: 34657, source: 'coal_mining', genset: 'man' as GensetId },
  { id: 'G10187', label: 'Mildred Lake & Aurora (AB · 30,134 kg/d)', kgDay: 30134, source: 'oil_sands', genset: 'man' as GensetId },
  { id: 'G10443', label: 'Vancouver Landfill (BC · 14,037 kg/d)', kgDay: 14037, source: 'landfill_waste', genset: 'cat3520' as GensetId },
  { id: 'G12350', label: 'Mission Landfill (BC · 2,636 kg/d)', kgDay: 2636, source: 'landfill_waste', genset: 'jenbacher316' as GensetId },
  { id: 'custom', label: 'Custom Wellhead / Cluster (850 kg/d)', kgDay: 850, source: 'oil_gas_extraction', genset: 'mobile250' as GensetId },
]

export default function HowTheMathWorks() {
  const { fiats } = useBtcPrice()
  const cadPerBtc = fiats.cad || 115000
  const usdPerBtc = fiats.usd || 85000

  const [presetId, setPresetId] = useState<string>('G10365')
  const [kgDay, setKgDay] = useState<number>(32544)
  const [gensetId, setGensetId] = useState<GensetId>('man')
  const [asicId, setAsicId] = useState<string>('s21xp')
  const [hutId, setHutId] = useState<string>('container-40ft-air')
  const [conditioningId, setConditioningId] = useState<GasConditioningPackage['id']>('full-landfill-siloxane')
  const [rateMode, setRateMode] = useState<'network' | 'optimistic'>('network')

  const selectPreset = (id: string) => {
    setPresetId(id)
    const found = PRESET_SITES.find(p => p.id === id)
    if (!found) return
    setKgDay(found.kgDay)
    setGensetId(found.genset)
    if (found.source.includes('landfill')) {
      setConditioningId('full-landfill-siloxane')
    } else {
      setConditioningId('h2s-scrubber')
    }
  }

  const genset = GENSET_DATA[gensetId] || GENSET_DATA.jenbacher316
  const asic = ASIC_MACHINES.find(a => a.id === asicId) || ASIC_MACHINES[0]

  const math = useMemo(() => {
    // Step 1: kg CH4/day -> Nm3/day
    const nm3PerDay = kgDay / 0.717
    // Step 2: Nm3/day -> Average electrical kW (with 0.9 derate and ÷ 24 hours)
    const derate = 0.9
    const gensetHoursPerDay = genset.methaneNm3h > 0 ? nm3PerDay / genset.methaneNm3h : 0
    const dailyKwh = gensetHoursPerDay * genset.powerKW * derate
    const avgPowerKw = computeGeneratorPower(kgDay, gensetId, derate)
    const gensetUnitsNeeded = Math.max(1, Math.ceil(avgPowerKw / (genset.powerKW * derate)))

    // Step 3: Average kW -> Miner Ceiling & Hashrate
    const minerCount = Math.max(0, Math.floor((avgPowerKw * 1000) / asic.power_w))
    const usedKw = (minerCount * asic.power_w) / 1000
    const totalThs = minerCount * asic.hashrate_ths
    const totalPhs = totalThs / 1000

    // Step 4: Capture Huts & Gas Conditioning BOM
    const hutBom = sizeCaptureHutsForBuild({
      powerKw: usedKw,
      minerCount,
      hutId,
      conditioningId,
    })

    // Step 5: CapEx Stack (CAD) + BTC Revenue (Network vs Optimistic)
    const gensetCapexCad = gensetUnitsNeeded * genset.powerKW * genset.capexPerKW
    const asicCapexCad = minerCount * asic.cost_cad
    const totalCapexCad = gensetCapexCad + asicCapexCad + hutBom.totalEnclosureAndGasTrainCad

    const btcPerThDay = rateMode === 'network' ? NETWORK_DERIVED_BTC_PER_TH_DAY : NETWORK_ESTIMATE_BTC_PER_TH_DAY
    const uptime = 0.95
    const poolFee = 0.015
    const dailyBtcGross = totalThs * btcPerThDay * (1 - poolFee) * uptime
    const dailySats = Math.round(dailyBtcGross * 1e8)
    const annualBtc = dailyBtcGross * 365

    // Stranded O&M power cost ($0.018 USD/kWh O&M-only for on-site gas + 5% annual hardware maint)
    const cadPerUsd = cadPerBtc / usdPerBtc
    const dailyOmCad = usedKw * 24 * 0.018 * cadPerUsd + (asicCapexCad * 0.05) / 365
    const dailyRevenueCad = dailyBtcGross * cadPerBtc
    const dailyNetCad = dailyRevenueCad - dailyOmCad
    const annualNetCad = dailyNetCad * 365
    const paybackYears = annualNetCad > 0 ? totalCapexCad / annualNetCad : Infinity
    const perMinerCapexCad = asic.cost_cad + (minerCount > 0 ? (gensetCapexCad + hutBom.totalEnclosureAndGasTrainCad) / minerCount : 0)
    const perMinerDailySats = minerCount > 0 ? Math.round(dailySats / minerCount) : 0
    const perMinerAnnualNetCad = minerCount > 0 ? Math.round(annualNetCad / minerCount) : 0

    // Step 6: 10% Sovereign Pension Compact
    const annualPensionBtc = annualBtc * 0.10
    const annualPensionCad = annualPensionBtc * cadPerBtc
    const annualOperatorBtc = annualBtc * 0.90

    return {
      nm3PerDay,
      gensetHoursPerDay,
      dailyKwh,
      avgPowerKw,
      gensetUnitsNeeded,
      minerCount,
      usedKw,
      totalThs,
      totalPhs,
      hutBom,
      gensetCapexCad,
      asicCapexCad,
      totalCapexCad,
      dailyBtcGross,
      dailySats,
      annualBtc,
      dailyRevenueCad,
      dailyOmCad,
      dailyNetCad,
      annualNetCad,
      paybackYears,
      perMinerCapexCad,
      perMinerDailySats,
      perMinerAnnualNetCad,
      annualPensionBtc,
      annualPensionCad,
      annualOperatorBtc,
    }
  }, [kgDay, gensetId, genset, asic, hutId, conditioningId, rateMode, cadPerBtc, usdPerBtc])

  return (
    <section
      className="rounded-3xl border border-[#5BC0BE]/35 bg-gradient-to-b from-[#0f172a] via-[#111c2d] to-[#0b111f] p-6 md:p-8 shadow-2xl"
      data-testid="how-the-math-works"
      aria-labelledby="math-engine-heading"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF8C00]/30 bg-[#FF8C00]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#FF8C00]">
            CODIFIED 6-STEP ECONOMICS · VERIFIED FORMULAS
          </div>
          <h2 id="math-engine-heading" className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">
            How the Math Adds Up: Molecules → Megawatts → ASICs &amp; Capture Huts → Sats
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-300">
            Every number on Stranded Value comes from one transparent, auditable chain of physics and Bitcoin network math. Pick any real ECCC site or adjust the sliders below to verify how per-ASIC and per-hut ROI is built.
          </p>
        </div>

        {/* Honest Hashprice Toggle */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-gray-400">Hashprice Basis</span>
          <div className="inline-flex rounded-xl border border-white/15 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setRateMode('network')}
              data-testid="math-rate-network"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                rateMode === 'network' ? 'bg-[#34D399] text-black' : 'text-gray-300 hover:text-white'
              }`}
            >
              Live Network (~0.41 sat/TH/d)
            </button>
            <button
              type="button"
              onClick={() => setRateMode('optimistic')}
              data-testid="math-rate-optimistic"
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                rateMode === 'optimistic' ? 'bg-[#FF8C00] text-black' : 'text-gray-300 hover:text-white'
              }`}
            >
              Optimistic Model (0.90 sat/TH/d)
            </button>
          </div>
          <span className="text-[11px] text-gray-400">
            {rateMode === 'network'
              ? 'Strictly derived: 450 BTC/day ÷ 1.1 ZH/s network hashrate'
              : 'App default optimistic scenario (~2.2× network reference)'}
          </span>
        </div>
      </div>

      {/* Interactive Controls Row */}
      <div className="mt-6 grid gap-4 md:grid-cols-4 bg-black/30 rounded-2xl p-4 border border-white/10">
        <div className="md:col-span-2">
          <label htmlFor="math-preset-site" className="block text-xs font-medium text-[#5BC0BE] mb-1">
            1. Benchmark Site (ECCC Reported CH₄)
          </label>
          <select
            id="math-preset-site"
            data-testid="math-preset-site"
            value={presetId}
            onChange={e => selectPreset(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-2 text-sm text-white"
          >
            {PRESET_SITES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={100}
              max={45000}
              step={50}
              value={kgDay}
              onChange={e => {
                setPresetId('custom')
                setKgDay(Number(e.target.value))
              }}
              aria-label="Daily methane emission in kg per day"
              className="flex-1 accent-[#FF8C00]"
            />
            <span className="font-mono text-sm font-bold text-[#FF8C00] shrink-0">
              {kgDay.toLocaleString('en-CA')} kg CH₄/d
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="math-genset-select" className="block text-xs font-medium text-[#5BC0BE] mb-1">
            2. Reciprocating Generator
          </label>
          <select
            id="math-genset-select"
            value={gensetId}
            onChange={e => setGensetId(e.target.value as GensetId)}
            className="w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-2 text-sm text-white"
          >
            {Object.entries(GENSET_DATA).map(([id, g]) => (
              <option key={id} value={id}>
                {g.name} ({g.powerKW} kW · {(g.eff * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
          <div className="mt-1.5 text-[11px] text-gray-400">
            Consumes {genset.methaneNm3h} Nm³/h · C${genset.capexPerKW}/kW
          </div>
        </div>

        <div>
          <label htmlFor="math-asic-select" className="block text-xs font-medium text-[#5BC0BE] mb-1">
            3. ASIC Machine &amp; Capture Hut
          </label>
          <select
            id="math-asic-select"
            value={asicId}
            onChange={e => setAsicId(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-2 text-sm text-white"
          >
            {ASIC_MACHINES.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.hashrate_ths} TH/s · {m.efficiency_j_th} J/TH · C${m.cost_cad.toLocaleString()})
              </option>
            ))}
          </select>
          <select
            aria-label="Capture hut enclosure type"
            value={hutId}
            onChange={e => setHutId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-1.5 text-xs text-gray-200"
          >
            {CAPTURE_HUT_SPECS.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} (up to {h.maxPowerKw} kW · C${(h.capexCad / 1000).toFixed(0)}k)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6-Step Visual Formula Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {/* Step 1 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#FF8C00] font-semibold mb-1">
              <span>STEP 1 · GAS FLOW</span>
              <Flame size={15} />
            </div>
            <div className="text-xl font-bold tabular-nums text-white">
              {Math.round(math.nm3PerDay).toLocaleString('en-CA')} <span className="text-xs font-normal text-gray-400">Nm³/d</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              {kgDay.toLocaleString('en-CA')} kg/day ÷ <code className="text-gray-200">0.717 kg/Nm³</code> standard CH₄ density.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-gray-400">
            {(kgDay * 365 / 1000).toFixed(0)} t CH₄/yr reported
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#5BC0BE] font-semibold mb-1">
              <span>STEP 2 · POWER</span>
              <Zap size={15} />
            </div>
            <div className="text-xl font-bold tabular-nums text-white">
              {Math.round(math.avgPowerKw).toLocaleString('en-CA')} <span className="text-xs font-normal text-gray-400">kW avg</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              (Nm³/d ÷ {genset.methaneNm3h} Nm³/h) × {genset.powerKW} kW × 0.90 derate <strong className="text-white">÷ 24h</strong>.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#5BC0BE]">
            {math.gensetUnitsNeeded} × {genset.name.split(' ')[0]} ({(math.avgPowerKw / 1000).toFixed(2)} MW)
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#FF8C00] font-semibold mb-1">
              <span>STEP 3 · ASIC FLEET</span>
              <Cpu size={15} />
            </div>
            <div className="text-xl font-bold tabular-nums text-white">
              {math.minerCount.toLocaleString('en-CA')} <span className="text-xs font-normal text-gray-400">ASICs</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              floor({Math.round(math.avgPowerKw)} kW × 1,000 ÷ {asic.power_w} W). Never exceeds gas ceiling.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#FF8C00]">
            {math.totalPhs.toFixed(1)} PH/s ({math.perMinerDailySats.toLocaleString()} sats/miner/d)
          </div>
        </div>

        {/* Step 4 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#5BC0BE] font-semibold mb-1">
              <span>STEP 4 · HUTS &amp; SKID</span>
              <Box size={15} />
            </div>
            <div className="text-xl font-bold tabular-nums text-white">
              {math.hutBom.hutCount} <span className="text-xs font-normal text-gray-400">× {math.hutBom.hutSpec.footprint.split(' ')[0]} Hut</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              {math.hutBom.hutSpec.name} + {math.hutBom.conditioning.name}.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-gray-300">
            Huts + scrubber: C${(math.hutBom.totalEnclosureAndGasTrainCad / 1e6).toFixed(2)}M
          </div>
        </div>

        {/* Step 5 */}
        <div className="rounded-2xl border border-[#34D399]/30 bg-[#34D399]/5 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#34D399] font-semibold mb-1">
              <span>STEP 5 · ROI &amp; SATS</span>
              <Bitcoin size={15} />
            </div>
            <div className="text-xl font-bold tabular-nums text-white" data-testid="math-annual-btc">
              {math.annualBtc.toFixed(2)} <span className="text-xs font-normal text-[#34D399]">BTC/yr</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-300 leading-relaxed">
              CapEx C${(math.totalCapexCad / 1e6).toFixed(2)}M · Net C${(math.annualNetCad / 1e6).toFixed(2)}M/yr after O&amp;M.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#34D399]">
            Payback: {Number.isFinite(math.paybackYears) ? `${math.paybackYears.toFixed(1)} yrs` : 'N/A'} (C${Math.round(math.perMinerCapexCad).toLocaleString()} all-in/ASIC)
          </div>
        </div>

        {/* Step 6 */}
        <div className="rounded-2xl border border-[#A78BFA]/35 bg-[#A78BFA]/10 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#A78BFA] font-semibold mb-1">
              <span>STEP 6 · 10% PENSION</span>
              <Landmark size={15} />
            </div>
            <div className="text-xl font-bold tabular-nums text-white" data-testid="math-pension-btc">
              {math.annualPensionBtc.toFixed(2)} <span className="text-xs font-normal text-[#A78BFA]">BTC/yr</span>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-300 leading-relaxed">
              If 10% is the ONLY tax, routed straight to the Canadian Sovereign Bitcoin Pension.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-mono text-[#A78BFA]">
            C${Math.round(math.annualPensionCad).toLocaleString('en-CA')}/yr to Canadians · 90% kept by operator
          </div>
        </div>
      </div>

      {/* Per-Unit Economics + Sourcing Breakdown Bar */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#FF8C00] mb-2">
            Unit Economics: Per 1 ASIC Machine ({asic.name})
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">ASIC Hardware Cost:</span><span className="font-mono text-white">C${asic.cost_cad.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Share of Genset + Capture Hut + Scrubber:</span><span className="font-mono text-gray-300">C${Math.max(0, Math.round(math.perMinerCapexCad - asic.cost_cad)).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-white/10 pt-1 font-semibold"><span className="text-gray-200">All-In Turnkey CapEx / Miner:</span><span className="font-mono text-[#FF8C00]">C${Math.round(math.perMinerCapexCad).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Daily Production / Miner:</span><span className="font-mono text-[#34D399]">{math.perMinerDailySats.toLocaleString()} sats/day</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Annual Net Profit / Miner:</span><span className="font-mono text-white">C${math.perMinerAnnualNetCad.toLocaleString()}/yr</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5BC0BE] mb-2">
            Capture Hut &amp; Gas Train BOM ({math.hutBom.hutCount} × Enclosure)
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-gray-400">Enclosures ({math.hutBom.hutCount} × C${(math.hutBom.hutSpec.capexCad / 1000).toFixed(0)}k):</span><span className="font-mono text-white">C${math.hutBom.totalHutCapexCad.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Gas Scrubber ({math.hutBom.conditioning.name.split(' ')[0]}):</span><span className="font-mono text-gray-300">C${math.hutBom.conditioningCapexCad.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Starlink + CSA Switchgear Interlocks:</span><span className="font-mono text-gray-300">C${math.hutBom.starlinkAndSwitchgearCad.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-white/10 pt-1 font-semibold"><span className="text-gray-200">Total Hut + Gas Conditioning:</span><span className="font-mono text-[#5BC0BE]">C${math.hutBom.totalEnclosureAndGasTrainCad.toLocaleString()}</span></div>
            <div className="text-[11px] text-gray-400 pt-0.5">
              Sourceable from: <span className="text-gray-200">{math.hutBom.hutSpec.sourcingRegions.join(' · ')}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#34D399] mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Why Methane Is Our Lead Story
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Methane is the <strong>only</strong> stranded energy source in Canada with facility-level federal reporting across <strong>2,611 sites</strong> (675 high-confidence). It needs <strong>zero grid connection</strong>, destroys a gas 28–80× more potent than CO₂, and deploys in 6–10 weeks using modular huts sourced anywhere on Earth.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {presetId !== 'custom' && (
              <Link
                href={`/map?site=${presetId}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF8C00] px-3.5 py-2 text-xs font-semibold text-black hover:bg-[#ff9d33] transition"
              >
                Open {presetId} on Live Map <ArrowRight size={13} />
              </Link>
            )}
            <Link
              href="/funding"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#5BC0BE]/40 px-3.5 py-2 text-xs font-semibold text-[#5BC0BE] hover:bg-[#5BC0BE]/10 transition"
            >
              Match Grants &amp; Capital →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
