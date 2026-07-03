'use client'

import { projectBtcRevenue } from '@/lib/halving'

type Props = { dailyBtc: number; btcUsd: number; years?: number }

export default function RoiProjectionChart({ dailyBtc, btcUsd, years = 8 }: Props) {
  const rows = projectBtcRevenue(dailyBtc, years)
  const max = Math.max(...rows.map(r => r.annualBtc * btcUsd), 1)

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">Multi-year revenue (halving-adjusted)</div>
      <div className="flex items-end gap-1 h-24">
        {rows.map(r => {
          const usd = r.annualBtc * btcUsd
          const h = Math.max(4, (usd / max) * 100)
          return (
            <div key={r.year} className="flex-1 flex flex-col items-center gap-1" title={`${r.year}: $${Math.round(usd).toLocaleString()}`}>
              <div className="w-full bg-[#FF8C00]/80 rounded-t" style={{ height: `${h}%` }} />
              <span className="text-[8px] text-gray-500 font-mono">{String(r.year).slice(2)}</span>
            </div>
          )
        })}
      </div>
      <div className="text-[10px] text-gray-500">Assumes constant hashrate; reward halves per schedule</div>
    </div>
  )
}