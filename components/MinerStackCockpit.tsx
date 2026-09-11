'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus, Info, Leaf, TrendingDown, Sparkles } from 'lucide-react'
import { GENSET_DATA, type GensetId } from '@/lib/sites'
import type { AsicSpec, FleetGenset } from '@/lib/fleet-template'
import {
  blockScaleLabel,
  capacityModel,
  formatCount,
  formatKw,
  formatMoneyShort,
  formatPayback,
  formatSats,
  satsPerDay,
  type HashpriceRead,
} from '@/lib/cockpit'

export type CockpitPreview = {
  satsPerDay: number
  /** Gross revenue of this build per day, in the selected fiat. */
  usdPerDay: number
  /** Net profit per day — what the site actually keeps. */
  netUsdPerDay: number
  kwUsed: number
  paybackDays: number
}

type Props = {
  siteId: string
  machineCount: number
  onCountChange: (count: number) => void
  mode: 'auto' | 'manual'
  onModeChange: (mode: 'auto' | 'manual') => void
  ceilingMiners: number
  gasCeilingKw: number
  asic: AsicSpec
  gensets: FleetGenset[]
  headGensetName: string
  headGensetId: GensetId
  onAddGenset: () => void
  onRemoveGenset: (gensetId: GensetId) => void
  canRemoveGenset: (gensetId: GensetId) => boolean
  /** Model for any candidate count — the same maths the panel and the exports use. */
  preview: (count: number) => CockpitPreview
  currencySymbol: string
  fiatCode: string
  siteEmissionKgDay: number
  capturedKgPerDay: number
  /** Tonnes of CO₂e avoided per year versus venting this gas (GWP100). */
  co2eAvoidedTonnesPerYear: number
  unusedKgPerDay: number
  unusedUsdPerDay: number
  hashprice: HashpriceRead
  powerCostUsdPerKwh: number
  dataYear?: number
  /** Layout variant: the docked desktop cockpit or the mobile bottom sheet. */
  variant?: 'docked' | 'sheet'
  /** Rendered under the bar (share/save/handoff row owned by the panel). */
  children?: React.ReactNode
}

const TIP = 'cockpit-tip'

/** Hover *and* tap/focus tooltip. Opens to the left so it can never clip at the panel edge. */
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        className="inline-flex items-center justify-center rounded-full h-11 w-11 md:h-6 md:w-6 text-[#5BC0BE] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
      >
        {children}
      </button>
      <span role="tooltip" className={`${TIP} pointer-events-none`}>{label}</span>
    </span>
  )
}

export default function MinerStackCockpit({
  siteId,
  machineCount,
  onCountChange,
  mode,
  onModeChange,
  ceilingMiners,
  gasCeilingKw,
  asic,
  gensets,
  headGensetName,
  headGensetId,
  onAddGenset,
  onRemoveGenset,
  canRemoveGenset,
  preview,
  currencySymbol,
  fiatCode,
  siteEmissionKgDay,
  capturedKgPerDay,
  co2eAvoidedTonnesPerYear,
  unusedKgPerDay,
  unusedUsdPerDay,
  hashprice,
  powerCostUsdPerKwh,
  dataYear,
  variant = 'docked',
  children,
}: Props) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingRef = useRef<number | null>(null)
  const dragRef = useRef<{ left: number; width: number; pointerId: number } | null>(null)
  /** Live value while dragging — committed to the panel on release. */
  const [dragCount, setDragCount] = useState<number | null>(null)
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [nudge, setNudge] = useState(false)

  const displayCount = dragCount ?? machineCount
  const atCeiling = ceilingMiners > 0 && displayCount >= ceilingMiners
  const capacity = capacityModel({
    count: displayCount,
    ceilingMiners,
    gasCeilingKw,
    asicWatts: asic.power_w,
  })
  const live = preview(displayCount)
  const liveSats = live.satsPerDay || satsPerDay(0)

  // Nudge the genset chip whenever the bar is full — the only honest way forward.
  useEffect(() => {
    if (!atCeiling) return
    setNudge(true)
    const id = setTimeout(() => setNudge(false), 1200)
    return () => clearTimeout(id)
  }, [atCeiling])

  const clamp = useCallback(
    (n: number) => {
      const floor = ceilingMiners > 0 ? Math.min(1, ceilingMiners) : 1
      const top = ceilingMiners > 0 ? ceilingMiners : Math.max(1, n)
      return Math.max(floor, Math.min(Math.floor(n), top))
    },
    [ceilingMiners],
  )

  const scheduleFrame = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const next = pendingRef.current
      pendingRef.current = null
      if (next != null) setDragCount(next)
    })
  }, [])

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const drag = dragRef.current
      if (!drag || drag.width <= 0 || ceilingMiners <= 0) return null
      const pct = Math.max(0, Math.min(1, (clientX - drag.left) / drag.width))
      return clamp(Math.round(pct * ceilingMiners))
    },
    [ceilingMiners, clamp],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (ceilingMiners <= 0) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    dragRef.current = { left: rect.left, width: rect.width, pointerId: e.pointerId }
    try { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId) } catch { /* capture unsupported */ }
    const v = valueFromClientX(e.clientX)
    if (v != null) { pendingRef.current = v; scheduleFrame() }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const v = valueFromClientX(e.clientX)
    if (v == null) return
    pendingRef.current = v
    scheduleFrame()
  }

  const endDrag = (commit: boolean) => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    const finalValue = pendingRef.current ?? dragCount
    pendingRef.current = null
    dragRef.current = null
    setDragCount(null)
    if (commit && finalValue != null && finalValue !== machineCount) {
      onModeChange('manual')
      onCountChange(finalValue)
    }
  }

  const step = (delta: number) => {
    const next = clamp(machineCount + delta)
    if (next === machineCount) return
    onModeChange('manual')
    onCountChange(next)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (ceilingMiners <= 0) return
    const big = e.shiftKey ? 10 : 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); step(big) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); step(-big) }
    else if (e.key === 'PageUp') { e.preventDefault(); step(Math.max(1, capacity.perBlock)) }
    else if (e.key === 'PageDown') { e.preventDefault(); step(-Math.max(1, capacity.perBlock)) }
    else if (e.key === 'Home') { e.preventDefault(); onModeChange('manual'); onCountChange(clamp(1)) }
    else if (e.key === 'End') { e.preventDefault(); onModeChange('manual'); onCountChange(clamp(ceilingMiners)) }
  }

  const commitTyped = () => {
    const v = Number(typed.replace(/[^0-9]/g, ''))
    setTyping(false)
    setTyped('')
    if (!Number.isFinite(v) || v <= 0) return
    onModeChange('manual')
    onCountChange(clamp(v))
  }

  const spareAmber = mode === 'manual' && capacity.sparePct > 0.5
  const ventingUsdPerYear = unusedUsdPerDay * 365

  return (
    <div className="cockpit" data-testid="site-cockpit" data-variant={variant}>
      {/* ---------- modes, human names ---------- */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex rounded-xl overflow-hidden border border-white/15 bg-black/30" role="group" aria-label="Build mode">
          <button
            type="button"
            onClick={() => onModeChange('auto')}
            aria-pressed={mode === 'auto'}
            className={`px-3 min-h-11 md:min-h-0 py-2 text-micro font-semibold transition ${mode === 'auto' ? 'bg-[#FF8C00] text-black' : 'text-gray-300 hover:text-white'}`}
            data-testid="cockpit-mode-fill"
          >
            Fill the gas
          </button>
          <button
            type="button"
            onClick={() => onModeChange('manual')}
            aria-pressed={mode === 'manual'}
            className={`px-3 min-h-11 md:min-h-0 py-2 text-micro font-semibold transition ${mode === 'manual' ? 'bg-[#5BC0BE] text-black' : 'text-gray-300 hover:text-white'}`}
            data-testid="cockpit-mode-mine"
          >
            My build
          </button>
        </div>
        <Tip label={mode === 'auto'
          ? 'Fill the gas: the miner stack captures every kg of methane this site can safely power. The biggest honest number.'
          : 'My build: you choose the miner count. Anything the gas could still feed shows as left on the table.'}>
          <Info size={14} aria-hidden />
        </Tip>
      </div>

      {/* ---------- the hero number ---------- */}
      <div className="cockpit-hero rounded-2xl px-4 py-3 mb-3" data-testid="cockpit-hero">
        <div className="text-micro uppercase tracking-widest text-[#5BC0BE] flex items-center gap-1.5">
          <Sparkles size={11} aria-hidden /> This build produces
        </div>
        <div className="flex items-baseline gap-2 flex-wrap mt-1">
          <span className="text-4xl font-bold text-white tabular-nums leading-none" data-testid="cockpit-sats">
            {formatSats(liveSats)}
          </span>
          <span className="text-sm text-[#FF8C00] font-semibold">sats / day</span>
          <span className="text-xs text-gray-400 tabular-nums" data-testid="cockpit-fiat">
            ≈ {formatMoneyShort(live.usdPerDay, currencySymbol)} / day
          </span>
        </div>
        <div className="text-micro text-gray-400 mt-1.5 tabular-nums">
          {formatCount(capacity.miners)} miners · {formatKw(live.kwUsed)} kW of {formatKw(gasCeilingKw)} kW gas · payback {formatPayback(live.paybackDays)}
        </div>
      </div>

      {/* ---------- venting baseline vs your build ---------- */}
      <div className="grid grid-cols-2 gap-2 mb-3" data-testid="cockpit-venting-compare">
        <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-2 opacity-80">
          <div className="text-micro text-gray-400 flex items-center gap-1">
            <TrendingDown size={11} aria-hidden /> Venting today
          </div>
          <div className="text-sm font-semibold text-gray-300 tabular-nums">0 sats/day</div>
          <div className="text-micro text-gray-500 tabular-nums">
            {formatCount(siteEmissionKgDay)} kg CH₄/day to atmosphere
          </div>
          <svg viewBox="0 0 100 20" className="w-full h-4 mt-1" aria-hidden>
            <line x1="0" y1="18" x2="100" y2="18" stroke="rgba(148,163,184,0.5)" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        </div>
        <div className="rounded-xl border border-[#34D399]/35 bg-[#34D399]/10 px-3 py-2">
          <div className="text-micro text-[#34D399] flex items-center gap-1">
            <Leaf size={11} aria-hidden /> Your build
          </div>
          <div className="text-sm font-semibold text-white tabular-nums" data-testid="cockpit-venting-gain">
            +{formatMoneyShort(Math.max(0, live.netUsdPerDay), currencySymbol)}/day net
          </div>
          <div className="text-micro text-[#34D399] tabular-nums" data-testid="cockpit-co2e">
            +{formatCount(co2eAvoidedTonnesPerYear, 0)} t CO₂e avoided/yr
          </div>
          <svg viewBox="0 0 100 20" className="w-full h-4 mt-1" aria-hidden>
            <polyline points="0,18 20,14 40,10 60,7 80,4 100,2" fill="none" stroke="#34D399" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* ---------- the miner stack ---------- */}
      <div className="rounded-2xl border border-[#FF8C00]/25 bg-black/25 p-3" data-testid="miner-stack">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-micro font-semibold text-[#FF8C00] uppercase tracking-wider">Miner stack</span>
          <span className="text-micro text-gray-400" data-testid="cockpit-block-legend">{blockScaleLabel(capacity.miners)}</span>
        </div>

        {/* numeric label first — the bar must read in grayscale and to a colour-blind user */}
        <div className="flex items-baseline justify-between gap-2 text-micro tabular-nums" data-testid="miner-stack-gauge-label">
          <span className="text-white font-semibold">
            {formatCount(capacity.miners)} / {formatCount(capacity.ceilingMiners)} miners
          </span>
          <span className="text-[#5BC0BE]">
            {formatKw(capacity.usedKw)} kW of {formatKw(gasCeilingKw)} kW
          </span>
        </div>

        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label={`Miner stack: ${capacity.miners} of ${capacity.ceilingMiners} miners powered by ${formatKw(gasCeilingKw)} kW of site gas`}
          aria-valuemin={0}
          aria-valuemax={capacity.ceilingMiners}
          aria-valuenow={capacity.miners}
          aria-valuetext={`${capacity.miners} miners, ${formatKw(capacity.usedKw)} kW used of ${formatKw(gasCeilingKw)} kW available`}
          aria-disabled={ceilingMiners <= 0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => endDrag(true)}
          onPointerCancel={() => endDrag(false)}
          onKeyDown={onKeyDown}
          className="cockpit-bar relative w-full h-11 mt-1.5 rounded-xl bg-white/10 border border-white/15 overflow-hidden cursor-ew-resize touch-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C00]"
          data-testid="miner-stack-bar"
        >
          {/* filled = your miners */}
          <div
            className="absolute inset-y-0 left-0 flex items-stretch gap-px px-1 py-1 cockpit-filled"
            style={{ width: `${capacity.filledPct}%` }}
          >
            {Array.from({ length: capacity.filledBlocks }).map((_, i) => (
              <span key={i} className="cockpit-block flex-1 min-w-0 rounded-[3px] bg-gradient-to-b from-[#7fe3e1] to-[#3f9c99] border border-[#5BC0BE]/60" />
            ))}
            {capacity.partialBlock > 0 && (
              <span className="cockpit-block flex-none min-w-0 rounded-[3px] bg-gradient-to-b from-[#7fe3e1] to-[#3f9c99] border border-[#5BC0BE]/60" style={{ flexBasis: `${capacity.partialBlock * 14}px` }} />
            )}
          </div>
          {/* hollow/amber = spare gas you are not using */}
          {capacity.sparePct > 0.5 && (
            <div
              className={`absolute inset-y-0 cockpit-spare ${spareAmber ? 'cockpit-spare--amber' : ''}`}
              style={{ left: `${capacity.filledPct}%`, width: `${capacity.sparePct}%` }}
              aria-hidden
            >
              <div className="h-full w-full flex items-stretch gap-px px-1 py-1">
                {Array.from({ length: Math.min(capacity.spareBlocks, 40) }).map((_, i) => (
                  <span key={i} className="flex-1 min-w-0 rounded-[3px] border border-dashed border-white/25" />
                ))}
              </div>
            </div>
          )}
          {/* drag affordance at the fill edge */}
          {ceilingMiners > 0 && (
            <span
              className="absolute top-0 bottom-0 w-[3px] bg-white/90 rounded-full pointer-events-none"
              style={{ left: `calc(${capacity.filledPct}% - 1.5px)` }}
              aria-hidden
            />
          )}
        </div>

        {/* spare segment carries its own figure */}
        <div className="flex items-center justify-between gap-2 mt-1 text-micro tabular-nums">
          <span className="text-[#5BC0BE]">▪ your miners ({formatCount(capacity.miners)})</span>
          {capacity.spareMiners > 0 ? (
            <span className="text-amber-300" data-testid="miner-stack-spare-figure">
              ▫ left on the table: {formatCount(capacity.spareMiners)} miners · {formatKw(gasCeilingKw - capacity.usedKw)} kW
            </span>
          ) : (
            <span className="text-gray-400">no spare gas</span>
          )}
        </div>

        {/* ---- the only honest way past the ceiling ---- */}
        {atCeiling && ceilingMiners > 0 && (
          <div className="mt-2 flex justify-end" data-testid="miner-stack-gas-limit">
            <button
              type="button"
              onClick={onAddGenset}
              className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/70 bg-amber-400/15 px-3 py-2 min-h-11 text-micro font-semibold text-amber-200 hover:bg-amber-400/25 active:scale-[0.97] transition ${nudge ? 'cockpit-nudge' : ''}`}
              data-testid="miner-stack-add-genset"
              aria-label={`Add another ${headGensetName} — raises the gas ceiling so more miners can run`}
            >
              <Plus size={13} aria-hidden /> Add another {headGensetName}
            </button>
          </div>
        )}

        {/* ---- − / + / type an exact count ---- */}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={capacity.miners <= 1}
            aria-label={`Remove one miner — currently ${formatCount(machineCount)}`}
            className="h-12 w-12 shrink-0 rounded-xl border border-white/20 bg-black/20 text-white text-2xl leading-none hover:bg-[#5BC0BE]/20 active:scale-95 transition disabled:opacity-35"
            data-testid="miner-stack-dec"
          >
            <Minus className="mx-auto" size={18} aria-hidden />
          </button>
          <div className="flex-1 min-w-0">
            {typing ? (
              <input
                autoFocus
                value={typed}
                inputMode="numeric"
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitTyped(); if (e.key === 'Escape') { setTyping(false); setTyped('') } }}
                onBlur={commitTyped}
                aria-label="Exact miner count"
                placeholder={String(machineCount)}
                className="w-full text-center text-xl font-bold tabular-nums bg-black/40 border border-[#5BC0BE]/50 rounded-lg py-1.5 text-white"
                data-testid="miner-stack-input"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setTyped(String(machineCount)); setTyping(true) }}
                aria-label={`Miner count ${formatCount(machineCount)} — tap to type an exact number`}
                className="w-full min-h-11 text-center rounded-lg py-1 hover:bg-white/5"
                data-testid="miner-stack-count"
              >
                <span className="block text-2xl font-bold text-white tabular-nums leading-none">{formatCount(machineCount)}</span>
                <span className="block text-micro text-gray-400 mt-0.5">miners · {mode === 'auto' ? 'Fill the gas' : 'My build'} · tap to type</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={ceilingMiners > 0 && capacity.miners >= ceilingMiners}
            aria-label={`Add one miner — currently ${formatCount(machineCount)} of ${formatCount(ceilingMiners)} the gas supports`}
            className="h-12 w-12 shrink-0 rounded-xl border border-[#FF8C00]/50 bg-black/20 text-[#FF8C00] text-2xl leading-none hover:bg-[#FF8C00]/20 active:scale-95 transition disabled:opacity-35"
            data-testid="miner-stack-inc"
          >
            <Plus className="mx-auto" size={18} aria-hidden />
          </button>
        </div>

        <div className="mt-1.5 text-micro text-gray-400">
          {asic.name} · {asic.hashrate_ths} TH/s @ {asic.power_w} W · drag the bar, tap ±, or type a count
        </div>

        {/* genset inventory — the units that set the ceiling */}
        <div className="mt-2 space-y-1" data-testid="miner-stack-gensets">
          {gensets.map(g => (
            <div key={g.gensetId} className="flex items-center justify-between gap-2 text-micro text-gray-300">
              <span className="truncate tabular-nums">
                {g.count} × {GENSET_DATA[g.gensetId]?.name} · {formatKw((GENSET_DATA[g.gensetId]?.powerKW || 0) * g.count)} kW rated
              </span>
              <button
                type="button"
                onClick={() => onRemoveGenset(g.gensetId)}
                disabled={!canRemoveGenset(g.gensetId)}
                title={canRemoveGenset(g.gensetId) ? 'Remove one unit' : 'Remove miners first — they need this unit'}
                aria-label={`Remove one ${GENSET_DATA[g.gensetId]?.name} (${g.count} installed)`}
                className="h-11 w-11 md:h-8 md:w-8 shrink-0 rounded-lg border border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-30"
                data-testid={`miner-stack-remove-${g.gensetId}`}
              >
                <Minus className="mx-auto" size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>

        {ceilingMiners <= 0 && (
          <div className="mt-2 text-micro text-amber-300" data-testid="miner-stack-no-gas">
            No usable gas at this site — the miner stack stays at zero until a genset has gas to burn.
          </div>
        )}

        {/* ---- live readout strip ---- */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 text-micro" data-testid="cockpit-readout-strip">
          <div className="min-w-0">
            <div className="text-gray-400">Miners</div>
            <div className="text-white font-semibold tabular-nums">{formatCount(capacity.miners)}</div>
          </div>
          <div className="min-w-0">
            <div className="text-gray-400">Power</div>
            <div className="text-[#5BC0BE] font-semibold tabular-nums">{formatKw(capacity.usedKw)} / {formatKw(gasCeilingKw)} kW</div>
          </div>
          <div className="min-w-0">
            <div className="text-gray-400">Sats / day</div>
            <div className="text-[#FF8C00] font-semibold tabular-nums">{formatSats(liveSats)}</div>
          </div>
          <div className="min-w-0">
            <div className="text-gray-400">Payback</div>
            <div className="text-white font-semibold tabular-nums">{formatPayback(live.paybackDays)}</div>
          </div>
          <div className={`min-w-0 ${showAll ? '' : 'hidden md:block'}`}>
            <div className="text-gray-400">CH₄ captured</div>
            <div className="text-[#34D399] font-semibold tabular-nums">
              {formatCount(capturedKgPerDay)} kg/d · {siteEmissionKgDay > 0 ? Math.round((capturedKgPerDay / siteEmissionKgDay) * 100) : 0}%
            </div>
          </div>
          <div className={`min-w-0 ${showAll ? '' : 'hidden md:block'}`}>
            <div className="text-gray-400">Cash / day</div>
            <div className="text-white font-semibold tabular-nums">{formatMoneyShort(live.usdPerDay, currencySymbol)}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(v => !v)}
          className="mt-1 md:hidden text-micro text-[#5BC0BE] underline min-h-11"
          aria-expanded={showAll}
          data-testid="cockpit-readout-more"
        >
          {showAll ? 'Show less' : 'Show all figures'}
        </button>

        {/* the teaching moment — information, never a scolding */}
        {spareAmber && (
          <div className="mt-3 rounded-xl border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-micro leading-snug text-amber-100" data-testid="miner-stack-venting">
            <span className="font-semibold">Left on the table:</span>{' '}
            <span className="tabular-nums">
              {formatCount(unusedKgPerDay)} kg CH₄/day ({formatCount(unusedKgPerDay * 365 / 1000, 1)} t/yr) that this site already has gas for —
              about {formatMoneyShort(unusedUsdPerDay, currencySymbol)}/day unmined, {formatMoneyShort(ventingUsdPerYear, currencySymbol)}/year.
            </span>
            <button type="button" onClick={() => onModeChange('auto')} className="ml-1 inline-flex items-center min-h-11 underline font-semibold hover:text-white">
              Fill the gas instead
            </button>
          </div>
        )}

        {/* ---- honesty: how this number is made ---- */}
        <details className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2" data-testid="cockpit-how">
          <summary className="text-micro font-semibold text-[#5BC0BE] cursor-pointer flex items-center gap-1.5 min-h-11 md:min-h-0">
            <Info size={12} aria-hidden /> How this number is made
          </summary>
          <ul className="mt-2 space-y-1.5 text-micro text-gray-300 leading-snug">
            <li>
              <span className="text-gray-400">Hashprice used:</span>{' '}
              <span className="tabular-nums text-white">${hashprice.usedUsdPerThDay.toFixed(4)} per TH/s per day</span>{' '}
              {hashprice.aboveNetwork === null
                ? '— in line with the network-derived estimate'
                : hashprice.aboveNetwork
                  ? <span className="text-amber-300">— optimistic scenario: above the network-derived estimate of ${hashprice.networkUsdPerThDay.toFixed(4)}/TH/day</span>
                  : <span className="text-[#34D399]">— below the network-derived estimate (${hashprice.networkUsdPerThDay.toFixed(4)})</span>}
            </li>
            <li>
              <span className="text-gray-400">Break-even for power alone:</span>{' '}
              <span className="tabular-nums text-white">${hashprice.breakEvenUsdPerThDay.toFixed(4)} per TH/s per day</span> at the assumed{' '}
              ${powerCostUsdPerKwh.toFixed(2)}/kWh.
            </li>
            <li>
              <span className="text-gray-400">Power cost assumption:</span>{' '}
              <span className="tabular-nums text-white">${powerCostUsdPerKwh.toFixed(2)}/kWh</span>, {formatCount(asic.power_w)} W per miner at the site.
            </li>
            <li>
              <span className="text-gray-400">Data year:</span>{' '}
              <span className="tabular-nums text-white">{dataYear ? String(dataYear) : 'not stated'}</span> — emissions are measured, not modelled.
            </li>
            <li className="pt-1 text-gray-400">
              Every figure is an estimate. <a href="/open-data" className="underline text-[#5BC0BE]">Verify this yourself →</a>
            </li>
          </ul>
        </details>

        {children}
      </div>
    </div>
  )
}
