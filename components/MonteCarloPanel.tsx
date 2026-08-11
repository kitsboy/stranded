'use client'

import { useState } from 'react'
import { runMonteCarloRoi, type MonteCarloResult } from '@/lib/monte-carlo'

export default function MonteCarloPanel({ baseDailyCad, className = '' }: { baseDailyCad: number; className?: string }) {
  const [result, setResult] = useState<MonteCarloResult | null>(null)
  const [running, setRunning] = useState(false)

  const run = () => {
    setRunning(true)
    // yield paint then run sync sim
    setTimeout(() => {
      setResult(runMonteCarloRoi(baseDailyCad, { trials: 800, seed: 7 }))
      setRunning(false)
    }, 20)
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`} data-testid="monte-carlo-panel">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-[#5BC0BE]">Monte Carlo ROI</h4>
        <button
          type="button"
          onClick={run}
          disabled={running || !(baseDailyCad > 0)}
          className="rounded-lg border border-[#5BC0BE]/40 px-2.5 py-1 text-[11px] text-[#5BC0BE] hover:bg-[#5BC0BE]/10 disabled:opacity-40"
        >
          {running ? 'Running…' : 'Run 800 trials'}
        </button>
      </div>
      <p className="text-[10px] text-gray-500 mb-2">BTC · uptime · gas shocks (seeded, illustrative)</p>
      {result && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-lg border border-white/10 p-2">
            <div className="text-[10px] text-gray-400">P10</div>
            <div className="font-mono text-amber-300">C${result.p10.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-2">
            <div className="text-[10px] text-gray-400">P50</div>
            <div className="font-mono text-white">C${result.p50.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-2">
            <div className="text-[10px] text-gray-400">P90</div>
            <div className="font-mono text-[#34D399]">C${result.p90.toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-2">
            <div className="text-[10px] text-gray-400">Mean</div>
            <div className="font-mono">C${result.mean.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
