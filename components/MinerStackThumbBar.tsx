'use client'

import { Minus, Plus } from 'lucide-react'
import { formatCount, formatKw, formatSats } from '@/lib/cockpit'

/**
 * Mobile thumb-zone controls for the bottom sheet: the same stack value as the
 * cockpit, pinned to the bottom of the sheet so ± and the bar are always within
 * a thumb's reach while the panel scrolls. Presentation only — it calls straight
 * back into the panel's single source of truth for the count.
 */
export default function MinerStackThumbBar({
  count,
  ceilingMiners,
  filledPct,
  usedKw,
  gasCeilingKw,
  satsPerDay,
  onStep,
  onJumpToStack,
}: {
  count: number
  ceilingMiners: number
  filledPct: number
  usedKw: number
  gasCeilingKw: number
  satsPerDay: number
  onStep: (delta: number) => void
  onJumpToStack: () => void
}) {
  const atCeiling = ceilingMiners > 0 && count >= ceilingMiners
  return (
    <div className="cockpit-thumb-bar mt-3 -mx-4 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" data-testid="cockpit-thumb-bar">
      <button
        type="button"
        onClick={onJumpToStack}
        className="w-full text-left"
        aria-label="Scroll to the miner stack"
      >
        <div className="flex items-baseline justify-between gap-2 text-micro tabular-nums">
          <span className="text-white font-semibold">
            {formatCount(count)} / {formatCount(ceilingMiners)} miners
          </span>
          <span className="text-[#FF8C00] font-semibold">{formatSats(satsPerDay)} sats/day</span>
        </div>
        <div className="h-2 w-full rounded-full bg-black/60 border border-white/10 mt-1 overflow-hidden flex">
          <div className="h-full bg-gradient-to-r from-[#7fe3e1] to-[#3f9c99]" style={{ width: `${filledPct}%` }} />
          {filledPct < 100 && <div className="h-full cockpit-spare cockpit-spare--amber flex-1" />}
        </div>
        <div className="text-micro text-gray-400 mt-0.5 tabular-nums">
          {formatKw(usedKw)} kW of {formatKw(gasCeilingKw)} kW · {atCeiling ? 'gas ceiling reached' : 'gas still spare'}
        </div>
      </button>
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={count <= 1}
          aria-label={`Remove one miner — currently ${formatCount(count)}`}
          className="h-11 flex-1 rounded-xl border border-white/20 bg-black/30 text-white active:scale-95 transition disabled:opacity-35"
        >
          <Minus className="mx-auto" size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={atCeiling}
          aria-label={`Add one miner — currently ${formatCount(count)} of ${formatCount(ceilingMiners)} the gas supports`}
          className="h-11 flex-1 rounded-xl border border-[#FF8C00]/50 bg-black/30 text-[#FF8C00] active:scale-95 transition disabled:opacity-35"
        >
          <Plus className="mx-auto" size={18} aria-hidden />
        </button>
      </div>
    </div>
  )
}
