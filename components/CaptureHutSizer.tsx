'use client'

import { useMemo, useState } from 'react'
import { Box, Cpu, Shield, Truck, Globe2, ThermometerSnowflake } from 'lucide-react'
import {
  CAPTURE_HUT_SPECS,
  GAS_CONDITIONING_PACKAGES,
  sizeCaptureHutsForBuild,
  type GasConditioningPackage,
} from '@/lib/capture-huts'
import { ASIC_MACHINES } from '@/lib/fleet-template'
import { GENSET_DATA, type GensetId } from '@/lib/sites'
import { NETWORK_DERIVED_BTC_PER_TH_DAY, NETWORK_ESTIMATE_BTC_PER_TH_DAY } from '@/lib/fleet-model'
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

  const asic = ASIC_MACHINES.find(a => a.id === selectedAsicId) || ASIC_MACHINES[0]
  const genset = GENSET_DATA[selectedGensetId] || GENSET_DATA.jenbacher316

  const summary = useMemo(() => {
    const minerCount = Math.max(1, Math.floor((targetKw * 1000) / asic.power_w))
    const bom = sizeCaptureHutsForBuild({
      powerKw: targetKw,
      minerCount,
      hutId: selectedHutId,
      conditioningId,
    })
    const gensetUnits = Math.max(1, Math.ceil(targetKw / (genset.powerKW * 0.9)))
    const gensetCapexCad = gensetUnits * genset.powerKW * genset.capexPerKW
    const asicCapexCad = minerCount * asic.cost_cad
    const totalTurnkeyCad = gensetCapexCad + asicCapexCad + bom.totalEnclosureAndGasTrainCad

    // Compute both network-derived and optimistic payback per ASIC and per Hut
    const totalThs = minerCount * asic.hashrate_ths
    const netFactor = (1 - 0.015) * 0.95
    const dailyBtcNetwork = totalThs * NETWORK_DERIVED_BTC_PER_TH_DAY * netFactor
    const dailyBtcOptimistic = totalThs * NETWORK_ESTIMATE_BTC_PER_TH_DAY * netFactor

    const cadPerUsd = cadPerBtc / usdPerBtc
    const dailyOmCad = targetKw * 24 * 0.018 * cadPerUsd + (asicCapexCad * 0.05) / 365

    const annualNetNetworkCad = (dailyBtcNetwork * cadPerBtc - dailyOmCad) * 365
    const annualNetOptimisticCad = (dailyBtcOptimistic * cadPerBtc - dailyOmCad) * 365

    const paybackYearsNetwork = annualNetNetworkCad > 0 ? totalTurnkeyCad / annualNetNetworkCad : Infinity
    const paybackYearsOptimistic = annualNetOptimisticCad > 0 ? totalTurnkeyCad / annualNetOptimisticCad : Infinity

    return {
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
    }
  }, [targetKw, asic, selectedHutId, conditioningId, genset, cadPerBtc, usdPerBtc])

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

      {/* Configurator Controls */}
      <div className="grid gap-4 md:grid-cols-4 bg-black/30 rounded-2xl p-4 border border-white/10 mb-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Site Power Target: <strong className="text-white">{targetKw.toLocaleString()} kW</strong>
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
            {(targetKw / 1000).toFixed(2)} MW continuous off-grid load
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
                {a.name} ({a.hashrate_ths} TH/s · {a.power_w}W · C${a.cost_cad.toLocaleString()})
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
      <div className="grid gap-4 lg:grid-cols-3">
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

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5BC0BE] mb-2 flex items-center gap-1.5">
              <Globe2 size={14} /> Global Sourcing &amp; Field Specs
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-2">
              {summary.bom.hutSpec.notes}
            </p>
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
          <div className="mt-3 pt-2 border-t border-white/10 text-[10px] text-gray-500">
            Vendor-neutral screening estimates. No manufacturer endorsement or partnership claimed.
          </div>
        </div>
      </div>
    </section>
  )
}
