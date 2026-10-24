'use client'

import { useEffect, useMemo, useState } from 'react'
import { ASIC_MACHINES } from '@/lib/fleet-template'
import { DEFAULT_POWER_COST_USD_PER_KWH, NETWORK_DERIVED_BTC_PER_TH_DAY, NETWORK_ESTIMATE_BTC_PER_TH_DAY } from '@/lib/fleet-model'
import {
  assessEnergyLocation,
  computeEnergyBuild,
  type EnergyAssessment,
  type StatcanFile,
} from '@/lib/energy-build'

export type EnergyMapHit = {
  props: Record<string, unknown>
  lng: number
  lat: number
}

type Props = {
  hit: EnergyMapHit
  statcan: StatcanFile | null
  statcanStatus: 'loading' | 'ready' | 'error'
  liveBtcPrice?: number
  onClose: () => void
  compact?: boolean
}

function fmtKw(n: number): string {
  return `${Math.round(n).toLocaleString()} kW`
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 100) return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function fmtBtc(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const sign = n < 0 ? '−' : ''
  return `${sign}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 6 })} BTC`
}

function fmtPayback(days: number): string {
  if (!Number.isFinite(days)) return 'Does not pay back at this power price'
  if (days < 1) return 'Under a day'
  if (days < 365) return `${Math.round(days).toLocaleString()} days`
  const years = days / 365
  return `${years.toLocaleString(undefined, { maximumFractionDigits: 1 })} years`
}

export default function EnergyBuildPanel({ hit, statcan, statcanStatus, liveBtcPrice, onClose, compact }: Props) {
  const props = hit.props
  const assessment = useMemo(
    () => assessEnergyLocation(props, statcanStatus === 'ready' ? statcan : null),
    [props, statcan, statcanStatus],
  )
  const waiting = assessment.needsStatcan && statcanStatus === 'loading'
  const blocked = waiting || (assessment.needsStatcan && statcanStatus === 'error') || !assessment.buildable
  const locationId = String(props.id || props.name || '')
  const [asicId, setAsicId] = useState(ASIC_MACHINES[0].id)
  const [countText, setCountText] = useState('0')
  const [powerText, setPowerText] = useState(String(DEFAULT_POWER_COST_USD_PER_KWH))
  const asic = ASIC_MACHINES.find((machine) => machine.id === asicId) || ASIC_MACHINES[0]

  useEffect(() => {
    setAsicId(ASIC_MACHINES[0].id)
    setPowerText(String(DEFAULT_POWER_COST_USD_PER_KWH))
  }, [locationId])

  const model = useMemo(() => {
    if (blocked || !(assessment.powerKw && assessment.powerKw > 0)) return null
    const typed = Math.floor(Number(countText))
    return computeEnergyBuild({
      powerKw: assessment.powerKw,
      asic,
      machineCount: Number.isFinite(typed) ? typed : 0,
      btcPriceUsd: liveBtcPrice && liveBtcPrice > 0 ? liveBtcPrice : 0,
      powerCostUsdPerKwh: Number(powerText),
    })
  }, [blocked, assessment.powerKw, asic, countText, liveBtcPrice, powerText])

  useEffect(() => {
    if (!model) return
    setCountText(String(model.ceiling))
    // Fill the recorded ceiling when the location or the ASIC changes.
    // A later edit stays until one of those changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, asicId, model?.ceiling])

  const name = String(props.name || 'Unnamed location')
  const kindLabel = assessment.kind === 'remote' ? 'Remote community' : assessment.kind === 'plant' ? 'Renewable plant' : 'Energy record'
  const cfPct = assessment.capacityFactor != null
    ? `${(assessment.capacityFactor * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
    : ''

  return (
    <div
      className={`w-full bg-[#1e293b] border border-[#5BC0BE]/30 shadow-xl relative ${compact ? 'rounded-t-2xl p-4' : 'rounded-xl p-4 sm:p-6 max-h-[calc(100vh-8rem)] overflow-y-auto'}`}
      data-testid="energy-build-panel"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="font-bold text-white text-lg leading-tight truncate">{name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {kindLabel}
            {props.province ? ` · ${String(props.province)}` : ''}
            {assessment.period ? ` · file ${assessment.period}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-white/15 px-2 py-1 text-sm text-gray-300 hover:text-white"
          aria-label="Close build"
        >
          ✕
        </button>
      </div>

      <p className="text-sm text-gray-300 mb-3" data-testid="energy-build-basis">{assessment.basis}</p>

      {assessment.kind === 'plant' && assessment.provinceCapacityMw != null && (
        <p className="text-xs text-gray-400 mb-3">
          Plant file {assessment.period || 'period not stated'}: {assessment.nameplateMw != null ? `${assessment.nameplateMw.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW` : 'capacity not stated'}.
          {' '}Not a current-year capacity census.
          {assessment.province ? ` ${assessment.province} renewable capacity in the 2024 Statistics Canada table: ${assessment.provinceCapacityMw.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW.` : ''}
          {assessment.geothermalInProvinceMw > 0 ? ` The 2024 total includes ${assessment.geothermalInProvinceMw} MW geothermal. The plant file has 0 geothermal plants of 1 MW or more.` : ''}
        </p>
      )}

      {cfPct && (
        <p className="text-xs text-gray-400 mb-3">
          Province capacity factor used here: {cfPct}
          {assessment.capacityFactorCapped ? ' (capped at 100% because 2025 generation exceeded the 2024 capacity).' : '.'}
          {' '}Average power for the build: {assessment.powerKw != null ? fmtKw(assessment.powerKw) : '—'}.
        </p>
      )}

      {assessment.fuelPrice != null && (
        <p className="text-xs text-gray-400 mb-3" data-testid="energy-fuel-note">
          Recorded fuel price {assessment.fuelPrice} {assessment.fuelUnits || ''}. That is not a power price, so it is not used in the ROI.
        </p>
      )}

      {waiting && (
        <p className="text-sm text-[#5BC0BE]" data-testid="energy-build-waiting">Loading the 2024 capacity and 2025 generation tables…</p>
      )}

      {blocked && !waiting && (
        <div data-testid="energy-build-blocked">
          <p className="text-sm text-gray-300 mb-3">
            {statcanStatus === 'error' && assessment.needsStatcan
              ? 'The Statistics Canada table did not load, so miners are not sized.'
              : 'The ASIC menu is the same list used on methane sites. Payback stays blank because this file does not support a miner count.'}
          </p>
          <label className="text-sm font-semibold text-[#5BC0BE]" htmlFor="energy-asic-select">ASIC model</label>
          <select
            id="energy-asic-select"
            data-testid="energy-asic-select"
            value={asicId}
            disabled
            className="w-full mt-1 mb-2 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm opacity-70"
          >
            {ASIC_MACHINES.map((machine) => (
              <option key={machine.id} value={machine.id}>{machine.name} — {machine.hashrate_ths} TH/s @ {machine.power_w} W</option>
            ))}
          </select>
        </div>
      )}

      {!blocked && model && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-[#5BC0BE]" htmlFor="energy-asic-select">ASIC model</label>
            <select
              id="energy-asic-select"
              data-testid="energy-asic-select"
              value={asicId}
              onChange={(event) => setAsicId(event.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            >
              {ASIC_MACHINES.map((machine) => (
                <option key={machine.id} value={machine.id}>{machine.name} — {machine.hashrate_ths} TH/s @ {machine.power_w} W</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#5BC0BE]" htmlFor="energy-miner-count">
              Miners · recorded power supports up to {model.ceiling.toLocaleString()}
            </label>
            <input
              id="energy-miner-count"
              data-testid="energy-miner-count"
              type="number"
              min={0}
              max={model.ceiling}
              value={countText}
              onChange={(event) => setCountText(event.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
            {model.machineCount < Math.max(0, Math.floor(Number(countText) || 0)) && (
              <p className="text-xs text-gray-400 mt-1">Using {model.machineCount.toLocaleString()}. The recorded power stops there.</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-[#5BC0BE]" htmlFor="energy-power-price">
              Power price (USD/kWh) · site-wide default {DEFAULT_POWER_COST_USD_PER_KWH}
            </label>
            <input
              id="energy-power-price"
              data-testid="energy-power-price"
              type="number"
              min={0.001}
              step={0.01}
              value={powerText}
              onChange={(event) => setPowerText(event.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
            />
            {model.powerCostSubstituted && (
              <p className="text-xs text-[#FF8C00] mt-1">Zero is not used. The build kept {DEFAULT_POWER_COST_USD_PER_KWH} USD/kWh.</p>
            )}
            <p className="text-xs text-gray-500 mt-1">This is the labelled site-wide default, not this plant’s tariff.</p>
          </div>

          <div className="rounded-lg bg-slate-800/50 p-3 text-sm space-y-1.5" data-testid="energy-build-result">
            <div className="flex justify-between gap-3"><span className="text-gray-400">Miners in this build</span><span className="tabular-nums">{model.machineCount.toLocaleString()}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-400">Miner draw</span><span className="tabular-nums">{model.usedKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW of {fmtKw(model.availableKw)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-400">Optimistic daily profit</span><span className="tabular-nums text-[#FF8C00]" data-testid="energy-daily-profit">{fmtUsd(model.optimistic.dailyProfitUsd)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-400">Optimistic payback</span><span className="tabular-nums" data-testid="energy-payback">{fmtPayback(model.optimistic.paybackDays)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-400">Network-derived daily profit</span><span className="tabular-nums" data-testid="energy-network-profit">{fmtUsd(model.network.dailyProfitUsd)}</span></div>
            <div className="flex justify-between gap-3"><span className="text-gray-400">Network-derived payback</span><span className="tabular-nums" data-testid="energy-network-payback">{fmtPayback(model.network.paybackDays)}</span></div>
          </div>

          <p className="text-xs text-gray-400" data-testid="energy-hashprice-note">
            Optimistic hashprice {NETWORK_ESTIMATE_BTC_PER_TH_DAY.toFixed(7)} BTC/TH/day. The network-derived rate is {NETWORK_DERIVED_BTC_PER_TH_DAY.toFixed(9)} BTC/TH/day (450 BTC/day ÷ 1.1 billion TH/s). The optimistic line is not a forecast.
            {' '}Hardware is priced in CAD from the ASIC menu. CAD per BTC uses the documented fallback, scaled to the live USD price ({Math.round(model.cadPerBtc).toLocaleString()} CAD). Not a live CAD quote.
            {' '}Setup uses the site-wide default of {model.fixedSetupCad.toLocaleString()} CAD. Not a quote for this location. No generator and no carbon credit are added. Uptime 95%, pool fee 1.5%, maintenance 5% of hardware per year.
          </p>
          {model.optimistic.dailyProfitUsd < 0 && (
            <p className="text-xs text-[#FF8C00]">At this power price the build loses money per day. The payback stays blank on purpose.</p>
          )}
        </div>
      )}

      {props.sourceUrl ? (
        <p className="text-xs mt-3">
          <a href={String(props.sourceUrl)} target="_blank" rel="noopener noreferrer" className="text-[#FF8C00] hover:underline">
            {String(props.sourceTitle || 'Source')}
          </a>
          {props.licence ? <span className="text-gray-500"> · {String(props.licence)}</span> : null}
        </p>
      ) : null}
    </div>
  )
}

export type { EnergyAssessment }
