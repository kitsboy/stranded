'use client'

import { useMemo, useState } from 'react'

const DEFAULT_ASIC_POWER_W = 3500
const DEFAULT_ASIC_HASHRATE_TH = 200

interface AsicFleetSizerProps {
  className?: string
}

export default function AsicFleetSizer({ className = '' }: AsicFleetSizerProps) {
  const [mw, setMw] = useState(1.5)
  const [asicPowerW, setAsicPowerW] = useState(DEFAULT_ASIC_POWER_W)
  const [hashrateTh, setHashrateTh] = useState(DEFAULT_ASIC_HASHRATE_TH)

  const result = useMemo(() => {
    const powerW = mw * 1_000_000
    const count = Math.floor(powerW / asicPowerW)
    const totalHashrate = count * hashrateTh
    const containerEstimate = Math.ceil(count / 120)
    return { count, totalHashrate, containerEstimate, powerW }
  }, [mw, asicPowerW, hashrateTh])

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      <h3 className="font-semibold text-[#5BC0BE] mb-3">ASIC Fleet Sizer</h3>
      <div>
        <label className="text-xs text-gray-400">Available power: {mw.toFixed(2)} MW</label>
        <input type="range" min={0.1} max={12} step={0.1} value={mw} onChange={e => setMw(+e.target.value)} className="w-full accent-[#5BC0BE] mt-1" />
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-400">ASIC draw: {asicPowerW} W · {hashrateTh} TH/s</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <input type="range" min={2500} max={4500} step={50} value={asicPowerW} onChange={e => setAsicPowerW(+e.target.value)} className="w-full accent-[#FF8C00]" />
          <input type="range" min={100} max={350} step={5} value={hashrateTh} onChange={e => setHashrateTh(+e.target.value)} className="w-full accent-amber-400" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">ASICs</div>
          <div className="text-xl font-bold text-[#FF8C00] tabular-nums">{result.count.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">Hashrate</div>
          <div className="text-xl font-bold text-[#5BC0BE] tabular-nums">{(result.totalHashrate / 1000).toFixed(1)} PH</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400">Containers</div>
          <div className="text-xl font-bold tabular-nums">{result.containerEstimate}</div>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 mt-3">MW → ASIC count: floor(MW × 1e6 ÷ W per machine). ~120 ASICs per 40&apos; container.</p>
    </div>
  )
}