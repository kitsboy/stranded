'use client'

import { useMemo, useState } from 'react'
import { sketchTermSheet } from '@/lib/term-sheet'
import { downloadBlob } from '@/lib/export-formats'

type Props = {
  projectName?: string
  siteCount?: number
  totalCapexCad?: number
  annualRevenueCad?: number
  province?: string
  co2eTonnesYear?: number
}

export default function TermSheetCard({
  projectName = 'Stranded cluster pilot',
  siteCount = 10,
  totalCapexCad = 5_000_000,
  annualRevenueCad = 1_200_000,
  province,
  co2eTonnesYear,
}: Props) {
  const [equityPct, setEquityPct] = useState(40)
  const sketch = useMemo(
    () =>
      sketchTermSheet({
        projectName,
        siteCount,
        totalCapexCad,
        annualRevenueCad,
        equityPct,
        debtPct: 100 - equityPct,
        province,
        co2eTonnesYear,
      }),
    [projectName, siteCount, totalCapexCad, annualRevenueCad, equityPct, province, co2eTonnesYear],
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-testid="term-sheet-card">
      <h3 className="font-semibold text-[#FF8C00] mb-1">Term sheet sketch</h3>
      <p className="text-[11px] text-gray-400 mb-3">Illustrative structure — not an offer.</p>
      <label className="text-xs text-gray-400">Equity {equityPct}% / Debt {100 - equityPct}%</label>
      <input
        type="range"
        min={20}
        max={80}
        value={equityPct}
        onChange={e => setEquityPct(+e.target.value)}
        className="w-full accent-[#FF8C00] mt-1 mb-3"
        aria-label="Equity percentage"
      />
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 uppercase">Equity</div>
          <div className="font-mono text-[#5BC0BE]">C${sketch.equityCad.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 uppercase">Debt</div>
          <div className="font-mono">C${sketch.debtCad.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 uppercase">Payback</div>
          <div className="font-mono">{sketch.simplePaybackYears != null ? `${sketch.simplePaybackYears} yr` : '—'}</div>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <div className="text-[10px] text-gray-400 uppercase">Rev/CapEx</div>
          <div className="font-mono">{sketch.revenueToCapex ?? '—'}</div>
        </div>
      </div>
      <button
        type="button"
        className="w-full rounded-lg border border-white/15 py-2 text-xs hover:bg-white/5"
        onClick={() => downloadBlob(sketch.markdown, 'stranded-term-sheet-sketch.md', 'text/markdown')}
      >
        Download Markdown
      </button>
    </div>
  )
}
