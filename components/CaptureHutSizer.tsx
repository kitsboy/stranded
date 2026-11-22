'use client'

import { useMemo, useState } from 'react'
import { Box, Cpu, Shield, Truck, Globe2, ThermometerSnowflake, Flame, Download, Gauge } from 'lucide-react'
import { toast } from 'sonner'
import {
  CAPTURE_HUT_SPECS,
  GAS_CONDITIONING_PACKAGES,
  sizeCaptureHutsForBuild,
  type GasConditioningPackage,
} from '@/lib/capture-huts'
import { ASIC_MACHINES } from '@/lib/fleet-template'
import { GENSET_DATA, type GensetId } from '@/lib/sites'
import { NETWORK_DERIVED_BTC_PER_TH_DAY, NETWORK_ESTIMATE_BTC_PER_TH_DAY } from '@/lib/fleet-model'
import { downloadBlob } from '@/lib/export-formats'
import { useBtcPrice } from '@/components/BtcPriceProvider'

export default function CaptureHutSizer() {
  const { fiats } = useBtcPrice()
  const cadPerBtc = fiats.cad || 115000
  const usdPerBtc = fiats.usd || 85000

  const [selectedHutId, setSelectedHutId] = useState<string>(CAPTURE_HUT_SPECS[1].id)
  const [selectedAsicId, setSelectedAsicId] = useState<string>(ASIC_MACHINES[0].id)
  const [selectedGensetId, setSelectedGensetId] = useState<GensetId>('jenbacher316')
  const [conditioningId, setConditioningId] = useState<GasConditioningPackage['id']>('h2s-scrubber')
  const [targetKw, setTargetKw] = useState<number>(850)

  // Gas composition sliders (Upgrade #13)
  const [ch4Pct, setCh4Pct] = useState<number>(68)
  const [h2sPpm, setH2sPpm] = useState<number>(350)

  const asic = ASIC_MACHINES.find(a => a.id === selectedAsicId) || ASIC_MACHINES[0]
  const genset = GENSET_DATA[selectedGensetId] || GENSET_DATA.jenbacher316

  const summary = useMemo(() => {
    // Low CH4 (<50%) or extreme H2S (>1000 ppm) reduces effective continuous kW slightly and increases media OpEx
    const ch4Derate = ch4Pct >= 55 ? 1.0 : Math.max(0.72, ch4Pct / 55)
    const effectiveKw = Math.round(targetKw * ch4Derate)
    const h2sMediaAnnualCad = Math.round((h2sPpm / 100) * (effectiveKw / 250) * 1800)

    const minerCount = Math.max(1, Math.floor((effectiveKw * 1000) / asic.power_w))
    const bom = sizeCaptureHutsForBuild({
      powerKw: effectiveKw,
      minerCount,
      hutId: selectedHutId,
      conditioningId,
    })
    const gensetUnits = Math.max(1, Math.ceil(effectiveKw / (genset.powerKW * 0.9)))
    const gensetCapexCad = gensetUnits * genset.powerKW * genset.capexPerKW
    const asicCapexCad = minerCount * asic.cost_cad
    const totalTurnkeyCad = gensetCapexCad + asicCapexCad + bom.totalEnclosureAndGasTrainCad

    const totalThs = minerCount * asic.hashrate_ths
    const netFactor = (1 - 0.015) * 0.95
    const dailyBtcNetwork = totalThs * NETWORK_DERIVED_BTC_PER_TH_DAY * netFactor
    const dailyBtcOptimistic = totalThs * NETWORK_ESTIMATE_BTC_PER_TH_DAY * netFactor

    const cadPerUsd = cadPerBtc / usdPerBtc
    const dailyOmCad = effectiveKw * 24 * 0.018 * cadPerUsd + (asicCapexCad * 0.05 + h2sMediaAnnualCad) / 365

    const annualNetNetworkCad = (dailyBtcNetwork * cadPerBtc - dailyOmCad) * 365
    const annualNetOptimisticCad = (dailyBtcOptimistic * cadPerBtc - dailyOmCad) * 365

    const paybackYearsNetwork = annualNetNetworkCad > 0 ? totalTurnkeyCad / annualNetNetworkCad : Infinity
    const paybackYearsOptimistic = annualNetOptimisticCad > 0 ? totalTurnkeyCad / annualNetOptimisticCad : Infinity

    // Waste-Heat Co-Generation Sizer (Upgrade #12):
    // 1 kW electrical input to ASICs becomes ~0.92 kW recoverable thermal heat (3,140 BTU/hr per kW)
    // Plus engine jacket/exhaust heat (~1.15x electrical kW)
    const asicRecoverableThermalKw = Math.round(effectiveKw * 0.90)
    const engineJacketThermalKw = Math.round(effectiveKw * 1.10)
    const totalThermalKw = asicRecoverableThermalKw + engineJacketThermalKw
    const mmbtuPerHour = +(totalThermalKw * 0.003412).toFixed(2)
    const greenhouseAcresSupported = +(mmbtuPerHour / 1.8).toFixed(1)

    // Used / Refurb vs. Next-Gen ASIC Payback Matrix (Upgrade #17)
    const asicMatrix = ASIC_MACHINES.map(m => {
      const count = Math.max(1, Math.floor((effectiveKw * 1000) / m.power_w))
      const hwCad = count * m.cost_cad
      const turnkeyCad = gensetCapexCad + hwCad + bom.totalEnclosureAndGasTrainCad
      const ths = count * m.hashrate_ths
      const netBtcOpt = ths * NETWORK_ESTIMATE_BTC_PER_TH_DAY * netFactor
      const netBtcNet = ths * NETWORK_DERIVED_BTC_PER_TH_DAY * netFactor
      const om = effectiveKw * 24 * 0.018 * cadPerUsd + (hwCad * 0.05 + h2sMediaAnnualCad) / 365
      const yrNetOpt = (netBtcOpt * cadPerBtc - om) * 365
      const yrNetLive = (netBtcNet * cadPerBtc - om) * 365
      return {
        ...m,
        count,
        turnkeyCad,
        annualBtcOpt: +(netBtcOpt * 365).toFixed(2),
        paybackOptYrs: yrNetOpt > 0 ? +(turnkeyCad / yrNetOpt).toFixed(1) : null,
        paybackLiveYrs: yrNetLive > 0 ? +(turnkeyCad / yrNetLive).toFixed(1) : null,
      }
    })

    return {
      ch4Derate,
      effectiveKw,
      h2sMediaAnnualCad,
      minerCount,
      bom,
      gensetUnits,
      gensetCapexCad,
      asicCapexCad,
      totalTurnkeyCad,
      dailyBtcNetwork,
      dailyBtcOptimistic,
      annualNetNetworkCad,
      annualNetOptimisticCad,
      paybackYearsNetwork,
      paybackYearsOptimistic,
      asicRecoverableThermalKw,
      engineJacketThermalKw,
      totalThermalKw,
      mmbtuPerHour,
      greenhouseAcresSupported,
      asicMatrix,
    }
  }, [targetKw, ch4Pct, h2sPpm, asic, selectedHutId, conditioningId, genset, cadPerBtc, usdPerBtc])

  const exportRfqSpecSheet = (fmt: 'md' | 'csv') => {
    if (fmt === 'csv') {
      const rows = [
        ['Item', 'Specification', 'Quantity', 'Est_CapEx_CAD'],
        ['Capture Hut Enclosure', summary.bom.hutSpec.name, String(summary.bom.hutCount), String(summary.bom.totalHutCapexCad)],
        ['Prime Reciprocating Generator', genset.name, String(summary.gensetUnits), String(summary.gensetCapexCad)],
        ['Gas Conditioning & H2S Train', summary.bom.conditioning.name, '1', String(summary.bom.conditioningCapexCad)],
        ['Starlink + CSA Switchgear Interlocks', 'UL/CSA safety shutdown + PDU', String(summary.bom.hutCount), String(summary.bom.starlinkAndSwitchgearCad)],
        ['ASIC Compute Fleet', `${asic.name} (${asic.hashrate_ths} TH/s @ ${asic.power_w}W)`, String(summary.minerCount), String(summary.asicCapexCad)],
        ['TOTAL TURNKEY BOM', `${summary.effectiveKw} kW continuous`, '', String(summary.totalTurnkeyCad)],
      ]
      const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
      downloadBlob(csv, `stranded-hut-rfq-${summary.effectiveKw}kw.csv`, 'text/csv')
      toast.success('Vendor RFQ BOM exported (.csv)')
      return
    }
    const md = [
      `# Vendor-Neutral Request for Quotation (RFQ) — Stranded Methane Capture Hut BOM`,
      ``,
      `- **Generated:** ${new Date().toISOString().slice(0, 10)} via https://stranded.giveabit.io`,
      `- **Target Electrical Load:** ${summary.effectiveKw.toLocaleString()} kW continuous (${(summary.effectiveKw / 1000).toFixed(2)} MW)`,
      `- **Gas Quality Basis:** ${ch4Pct}% CH₄ · ${h2sPpm} ppm H₂S (Derate factor ${(summary.ch4Derate * 100).toFixed(0)}%)`,
      `- **Co-Gen Thermal Output:** ${summary.mmbtuPerHour} MMBtu/hr (${summary.totalThermalKw.toLocaleString()} kWth — supports ~${summary.greenhouseAcresSupported} acres Arctic greenhouse)`,
      ``,
      `## Bill of Materials (Indicative CAD Screening Budget)`,
      `| Line Item | Specification | Qty | Est. CapEx (CAD) |`,
      `|---|---|---:|---:|`,
      `| **Capture Hut Enclosure** | ${summary.bom.hutSpec.name} (${summary.bom.hutSpec.footprint}) | ${summary.bom.hutCount} | C$${summary.bom.totalHutCapexCad.toLocaleString()} |`,
      `| **Reciprocating Generator** | ${genset.name} (${genset.powerKW} kW rated) | ${summary.gensetUnits} | C$${summary.gensetCapexCad.toLocaleString()} |`,
      `| **Gas Scrubber & Dryer** | ${summary.bom.conditioning.name} | 1 | C$${summary.bom.conditioningCapexCad.toLocaleString()} |`,
      `| **Switchgear & Telemetry** | CSA/UL transfer switch + Starlink + CH₄/H₂S interlocks | ${summary.bom.hutCount} | C$${summary.bom.starlinkAndSwitchgearCad.toLocaleString()} |`,
      `| **ASIC Fleet** | ${asic.name} (${asic.hashrate_ths} TH/s · ${asic.efficiency_j_th} J/TH) | ${summary.minerCount} | C$${summary.asicCapexCad.toLocaleString()} |`,
      `| **Total Turnkey CapEx** | All-in before ITC/grants | — | **C$${summary.totalTurnkeyCad.toLocaleString()}** |`,
      ``,
      `## Qualifying Sourcing Regions`,
      `- ${summary.bom.hutSpec.sourcingRegions.join('\n- ')}`,
      ``,
      `> Screening estimate only — request binding factory-gate + freight quotes from 3+ CSA/CE fabricators.`,
    ].join('\n')
    downloadBlob(md, `stranded-hut-rfq-${summary.effectiveKw}kw.md`, 'text/markdown')
    toast.success('Vendor RFQ Spec-Sheet exported (.md)')
  }

  return (
    <section
      className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 md:p-8"
      data-testid="capture-hut-sizer"
      aria-labelledby="hut-sizer-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5BC0BE]/35 bg-[#5BC0BE]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#5BC0BE]">
            <Box size={13} /> VENDOR-NEUTRAL HARDWARE &amp; ENCLOSURE SOURCING
          </div>
          <h2 id="hut-sizer-heading" className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">
            Methane Capture Huts &amp; Per-ASIC Turnkey BOM
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-300">
            We are never locked to one proprietary vendor. Standard ISO 10ft/20ft/40ft Arctic mining huts, H₂S gas scrubbers, and reciprocating generators can be sourced from fabrication yards in Alberta, Ontario, Texas, Europe, or Asia and landed at a Canadian wellhead or landfill in 4–12 weeks.
          </p>
        </div>

        {/* Upgrade #19: Vendor RFQ Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportRfqSpecSheet('md')}
            data-testid="hut-rfq-export-md"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#FF8C00]/40 bg-[#FF8C00]/10 px-3.5 py-2 text-xs font-semibold text-[#FF8C00] hover:bg-[#FF8C00]/20 transition"
          >
            <Download size={13} /> Export Vendor RFQ (.MD)
          </button>
          <button
            type="button"
            onClick={() => exportRfqSpecSheet('csv')}
            data-testid="hut-rfq-export-csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#5BC0BE]/40 bg-[#5BC0BE]/10 px-3.5 py-2 text-xs font-semibold text-[#5BC0BE] hover:bg-[#5BC0BE]/20 transition"
          >
            <Download size={13} /> Export BOM (.CSV)
          </button>
        </div>
      </div>

      {/* 4 Capture Hut Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {CAPTURE_HUT_SPECS.map(hut => {
          const active = hut.id === selectedHutId
          return (
            <button
              key={hut.id}
              type="button"
              onClick={() => {
                setSelectedHutId(hut.id)
                setTargetKw(hut.maxPowerKw)
              }}
              data-testid={`hut-card-${hut.id}`}
              className={`text-left rounded-2xl border p-4 transition flex flex-col justify-between ${
                active
                  ? 'border-[#FF8C00] bg-[#FF8C00]/10 shadow-[0_0_24px_-6px_rgba(255,140,0,0.45)]'
                  : 'border-white/10 bg-black/25 hover:border-white/25'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#5BC0BE]">
                  <span>{hut.footprint}</span>
                  <span>{hut.soundDbaAt15m} dBA</span>
                </div>
                <div className="mt-1.5 font-bold text-base text-white">{hut.name}</div>
                <div className="mt-1 text-xs text-[#FF8C00] font-semibold">
                  Up to {hut.maxPowerKw.toLocaleString()} kW · {hut.maxMiners} ASICs
                </div>
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">{hut.bestFor}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-300">
                  <span>Est. Enclosure CapEx:</span>
                  <span className="font-mono font-semibold text-white">C${hut.capexCad.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Arctic Rating:</span>
                  <span className="font-mono">{hut.ambientRangeC}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Lead Time:</span>
                  <span>{hut.leadTimeWeeks}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Configurator Controls + Gas Composition Sliders (Upgrade #13) */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 bg-black/30 rounded-2xl p-4 border border-white/10 mb-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Power Target: <strong className="text-white">{targetKw.toLocaleString()} kW</strong>
          </label>
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={targetKw}
            onChange={e => setTargetKw(Number(e.target.value))}
            aria-label="Site power target in kilowatts"
            className="w-full accent-[#FF8C00]"
          />
          <div className="text-[11px] text-gray-500 mt-1">
            Effective: {summary.effectiveKw.toLocaleString()} kW
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Gas CH₄ Purity: <strong className="text-[#5BC0BE]">{ch4Pct}%</strong>
          </label>
          <input
            type="range"
            min={35}
            max={95}
            step={1}
            value={ch4Pct}
            onChange={e => setCh4Pct(Number(e.target.value))}
            aria-label="Methane gas concentration percentage"
            className="w-full accent-[#5BC0BE]"
          />
          <div className="text-[11px] text-gray-500 mt-1">
            {ch4Pct < 55 ? `Low-BTU derate: ${(summary.ch4Derate * 100).toFixed(0)}%` : 'Full calorific rating'}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Sour Gas H₂S: <strong className="text-amber-300">{h2sPpm} ppm</strong>
          </label>
          <input
            type="range"
            min={0}
            max={2500}
            step={50}
            value={h2sPpm}
            onChange={e => setH2sPpm(Number(e.target.value))}
            aria-label="Hydrogen sulfide concentration in ppm"
            className="w-full accent-amber-400"
          />
          <div className="text-[11px] text-gray-500 mt-1">
            Media OpEx: C${summary.h2sMediaAnnualCad.toLocaleString()}/yr
          </div>
        </div>

        <div>
          <label htmlFor="hut-sizer-asic" className="block text-xs text-gray-400 mb-1">ASIC Machine Model</label>
          <select
            id="hut-sizer-asic"
            value={selectedAsicId}
            onChange={e => setSelectedAsicId(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-2 text-xs text-white"
          >
            {ASIC_MACHINES.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.hashrate_ths} TH/s · C${a.cost_cad.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hut-sizer-genset" className="block text-xs text-gray-400 mb-1">Prime Reciprocating Genset</label>
          <select
            id="hut-sizer-genset"
            value={selectedGensetId}
            onChange={e => setSelectedGensetId(e.target.value as GensetId)}
            className="w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-2 text-xs text-white"
          >
            {Object.entries(GENSET_DATA).map(([id, g]) => (
              <option key={id} value={id}>
                {g.name} ({g.powerKW} kW · C${g.capexPerKW}/kW)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hut-sizer-cond" className="block text-xs text-gray-400 mb-1">Gas Conditioning &amp; Scrubber</label>
          <select
            id="hut-sizer-cond"
            value={conditioningId}
            onChange={e => setConditioningId(e.target.value as GasConditioningPackage['id'])}
            className="w-full rounded-xl border border-white/15 bg-[#1e293b] px-3 py-2 text-xs text-white"
          >
            {GAS_CONDITIONING_PACKAGES.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} (+C${c.capexPerKwCad}/kW)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Turnkey Bill of Materials & Dual-Scenario ROI Output */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#FF8C00] mb-3 flex items-center gap-1.5">
            <Cpu size={14} /> Turnkey Bill of Materials (CAD)
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">{summary.minerCount.toLocaleString()} × {asic.name}:</span>
              <span className="font-mono text-white">C${summary.asicCapexCad.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{summary.bom.hutCount} × {summary.bom.hutSpec.name}:</span>
              <span className="font-mono text-white">C${summary.bom.totalHutCapexCad.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{summary.gensetUnits} × {genset.name}:</span>
              <span className="font-mono text-white">C${summary.gensetCapexCad.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{summary.bom.conditioning.name}:</span>
              <span className="font-mono text-gray-300">C${summary.bom.conditioningCapexCad.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Starlink + CSA Switchgear / Safety Interlocks:</span>
              <span className="font-mono text-gray-300">C${summary.bom.starlinkAndSwitchgearCad.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-white/15 pt-2 text-sm font-bold">
              <span className="text-white">Total Turnkey CapEx:</span>
              <span className="font-mono text-[#FF8C00]">C${summary.totalTurnkeyCad.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#34D399] mb-3 flex items-center gap-1.5">
            <Shield size={14} /> Honest Dual-Scenario ROI (Per Hut &amp; Per ASIC)
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-[#34D399]/30 bg-[#34D399]/5 p-3">
              <div className="text-[10px] uppercase text-[#34D399] font-semibold">Live Network Rate</div>
              <div className="mt-1 text-lg font-bold font-mono text-white">
                {(summary.dailyBtcNetwork * 365).toFixed(2)} BTC/yr
              </div>
              <div className="text-[11px] text-gray-300 mt-1">
                Net: C${Math.round(summary.annualNetNetworkCad).toLocaleString()}/yr
              </div>
              <div className="text-[11px] font-mono text-[#34D399] mt-1">
                Payback: {Number.isFinite(summary.paybackYearsNetwork) ? `${summary.paybackYearsNetwork.toFixed(1)} yrs` : 'N/A'}
              </div>
            </div>

            <div className="rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-3">
              <div className="text-[10px] uppercase text-[#FF8C00] font-semibold">Optimistic Scenario</div>
              <div className="mt-1 text-lg font-bold font-mono text-white">
                {(summary.dailyBtcOptimistic * 365).toFixed(2)} BTC/yr
              </div>
              <div className="text-[11px] text-gray-300 mt-1">
                Net: C${Math.round(summary.annualNetOptimisticCad).toLocaleString()}/yr
              </div>
              <div className="text-[11px] font-mono text-[#FF8C00] mt-1">
                Payback: {Number.isFinite(summary.paybackYearsOptimistic) ? `${summary.paybackYearsOptimistic.toFixed(1)} yrs` : 'N/A'}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            Both columns include full generator CapEx, capture hut enclosure, H₂S gas scrubber, and $0.018 USD/kWh on-site O&amp;M.
          </p>
        </div>

        {/* Upgrade #12: Waste-Heat Co-Generation Sizer + Global Sourcing */}
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 flex flex-col justify-between" data-testid="hut-waste-heat-cogen">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5BC0BE] mb-2 flex items-center gap-1.5">
              <Flame size={14} className="text-[#FF8C00]" /> Waste-Heat Co-Gen &amp; Global Sourcing
            </div>
            <div className="rounded-xl border border-[#FF8C00]/25 bg-[#FF8C00]/5 p-2.5 mb-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Recoverable Thermal Output:</span>
                <span className="font-mono font-bold text-[#FF8C00]">{summary.mmbtuPerHour} MMBtu/hr ({summary.totalThermalKw.toLocaleString()} kWth)</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                ASIC heat ({summary.asicRecoverableThermalKw} kWth) + Engine jacket ({summary.engineJacketThermalKw} kWth) → heats <strong>~{summary.greenhouseAcresSupported} acres</strong> of Canadian winter greenhouse for $0 fuel.
              </div>
            </div>
            <div className="text-[11px] text-gray-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <Truck size={12} className="text-[#FF8C00]" />
                <span><strong>Sourcing hubs:</strong> {summary.bom.hutSpec.sourcingRegions.join(', ')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ThermometerSnowflake size={12} className="text-[#5BC0BE]" />
                <span><strong>Representative OEMs:</strong> {summary.bom.hutSpec.sourcingExamples.join(', ')}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-500 flex items-center justify-between">
            <span>Vendor-neutral screening estimates.</span>
            <Globe2 size={12} />
          </div>
        </div>
      </div>

      {/* Upgrade #11: Interactive SVG Floorplan Blueprint + Upgrade #17: Used vs. Next-Gen ASIC Payback Matrix */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4" data-testid="hut-svg-blueprint">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5BC0BE] mb-2">
            <span>Engineering Schematic: {summary.bom.hutSpec.name} ({summary.bom.hutSpec.footprint})</span>
            <span className="font-mono text-[11px] text-gray-400">{summary.bom.hutSpec.coolingLabel}</span>
          </div>
          <svg viewBox="0 0 560 150" className="w-full h-36 rounded-xl bg-[#09101d] border border-white/10" role="img" aria-label="Capture hut and gas train engineering schematic">
            {/* Gas Scrubber Skid */}
            <rect x="12" y="34" width="92" height="82" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="58" y="58" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold">GAS SCRUBBER</text>
            <text x="58" y="73" textAnchor="middle" fill="#cbd5e1" fontSize="8">H₂S: {h2sPpm} ppm</text>
            <text x="58" y="87" textAnchor="middle" fill="#94a3b8" fontSize="8">CH₄: {ch4Pct}%</text>
            <text x="58" y="102" textAnchor="middle" fill="#34d399" fontSize="8">Knockout + Dryer</text>

            {/* Arrow 1 */}
            <line x1="104" y1="75" x2="132" y2="75" stroke="#FF8C00" strokeWidth="2" />
            <polygon points="132,71 140,75 132,79" fill="#FF8C00" />

            {/* Reciprocating Generator */}
            <rect x="142" y="26" width="130" height="98" rx="8" fill="#1e293b" stroke="#FF8C00" strokeWidth="1.8" />
            <text x="207" y="48" textAnchor="middle" fill="#FF8C00" fontSize="9" fontWeight="bold">{summary.gensetUnits}× {genset.name.toUpperCase().slice(0, 14)}</text>
            <text x="207" y="64" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">{summary.effectiveKw.toLocaleString()} kWe Continuous</text>
            <text x="207" y="80" textAnchor="middle" fill="#94a3b8" fontSize="8">480V / 600V CSA Switchgear</text>
            <text x="207" y="96" textAnchor="middle" fill="#fb923c" fontSize="8">+{summary.engineJacketThermalKw} kWth Jacket Heat</text>
            <text x="207" y="111" textAnchor="middle" fill="#34d399" fontSize="8">~98% CH₄ Destruction</text>

            {/* Arrow 2 */}
            <line x1="272" y1="75" x2="300" y2="75" stroke="#5BC0BE" strokeWidth="2" />
            <polygon points="300,71 308,75 300,79" fill="#5BC0BE" />

            {/* Modular Capture Hut Container */}
            <rect x="310" y="18" width="236" height="114" rx="10" fill="#0f172a" stroke="#5BC0BE" strokeWidth="2" />
            <text x="428" y="38" textAnchor="middle" fill="#5BC0BE" fontSize="9" fontWeight="bold">
              {summary.bom.hutCount}× {summary.bom.hutSpec.footprint.toUpperCase()} ({summary.bom.hutSpec.soundDbaAt15m} dBA)
            </text>
            {/* ASIC Rack Visuals */}
            {[0, 1, 2, 3, 4].map(i => (
              <rect key={i} x={326 + i * 42} y="48" width="34" height="44" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            ))}
            <text x="428" y="108" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
              {summary.minerCount.toLocaleString()} × {asic.name} ({((summary.minerCount * asic.hashrate_ths) / 1000).toFixed(1)} PH/s)
            </text>
            <text x="428" y="122" textAnchor="middle" fill="#34d399" fontSize="8">
              Starlink Telemetry · {summary.bom.hutSpec.ambientRangeC} · +{summary.asicRecoverableThermalKw} kWth Co-Gen
            </text>
          </svg>
        </div>

        {/* Upgrade #17: Used / Refurb vs. Next-Gen ASIC Payback Matrix */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4" data-testid="hut-asic-payback-matrix">
          <div className="flex items-center justify-between text-xs font-semibold text-[#FF8C00] mb-2">
            <span className="inline-flex items-center gap-1.5"><Gauge size={14} /> Used / Budget vs. Next-Gen ASIC Payback Matrix (@ {summary.effectiveKw} kW)</span>
            <span className="text-[11px] text-gray-400">Click row to select</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase text-gray-400">
                  <th className="py-1.5 pr-2">ASIC Model</th>
                  <th className="py-1.5 px-2 text-right">Units</th>
                  <th className="py-1.5 px-2 text-right">Turnkey CapEx</th>
                  <th className="py-1.5 px-2 text-right">BTC/yr (Opt)</th>
                  <th className="py-1.5 pl-2 text-right">Payback (Live / Opt)</th>
                </tr>
              </thead>
              <tbody>
                {summary.asicMatrix.map(row => {
                  const isSel = row.id === selectedAsicId
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedAsicId(row.id)}
                      className={`border-b border-white/5 cursor-pointer transition ${
                        isSel ? 'bg-[#FF8C00]/15 text-white font-semibold' : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <td className="py-1.5 pr-2">{row.name} <span className="text-[10px] text-gray-400">({row.efficiency_j_th} J/TH)</span></td>
                      <td className="py-1.5 px-2 text-right font-mono">{row.count.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-right font-mono">C${(row.turnkeyCad / 1e6).toFixed(2)}M</td>
                      <td className="py-1.5 px-2 text-right font-mono text-[#5BC0BE]">{row.annualBtcOpt}</td>
                      <td className="py-1.5 pl-2 text-right font-mono text-[#34D399]">
                        {row.paybackLiveYrs ? `${row.paybackLiveYrs}y` : 'N/A'} / <span className="text-[#FF8C00]">{row.paybackOptYrs ? `${row.paybackOptYrs}y` : 'N/A'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
