'use client'

import Link from 'next/link'
import type { LiveStats } from '@/types/live-stats'
import { homeKpiItems } from '@/lib/home-metrics'
import { useBtcUsd } from '@/components/BtcPriceProvider'

type Props = {
  stats: LiveStats | null
}

export default function HomeKpiStrip({ stats }: Props) {
  const btc = useBtcUsd()
  const items = stats ? homeKpiItems(stats, btc) : null

  if (!items) {
    return (
      <div
        data-testid="home-kpi-strip"
        className="border-y border-white/10 bg-black/20"
        aria-busy="true"
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex gap-6 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[7rem] h-12 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid="home-kpi-strip"
      className="border-y border-white/10 bg-black/20"
    >
      <div className="max-w-5xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Live KPIs</span>
          <Link href="/dashboard" className="text-[10px] text-[#5BC0BE] hover:underline">
            Open dashboard →
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
          {items.map(item => {
            const inner = (
              <>
                <div className="text-lg font-semibold text-[#FF8C00] tabular-nums leading-tight">
                  {item.value}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{item.label}</div>
                {item.sub && (
                  <div className="text-[9px] text-gray-500 mt-0.5 leading-tight">{item.sub}</div>
                )}
              </>
            )
            return item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className="min-w-[6.5rem] shrink-0 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 hover:border-[#FF8C00]/30 transition"
              >
                {inner}
              </Link>
            ) : (
              <div key={item.key} className="min-w-[6.5rem] shrink-0 px-3 py-2">
                {inner}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}