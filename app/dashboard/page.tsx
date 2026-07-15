'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { LiveStats } from '@/types/live-stats'
import { useBtcUsd } from '@/components/BtcPriceProvider'

const DEFAULT_CARBON_USD_PER_T = 25

export default function DashboardPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [carbonPrice, setCarbonPrice] = useState(DEFAULT_CARBON_USD_PER_T)
  const btc = useBtcUsd()

  useEffect(() => {
    const refresh = () => {
      fetch('/data/live-stats.json')
        .then(r => {
          if (!r.ok) throw new Error('stats')
          return r.json()
        })
        .then(s => { setStats(s); setLoadError(false) })
        .catch(() => setLoadError(true))
    }
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [])

  const carbonTotals = useMemo(() => {
    if (!stats) return null
    const tonnes5 = stats.impact.co2eAvoided5PctTonnes
    const tonnes100 = stats.impact.co2eAvoided100PctTonnes
    const scale = carbonPrice / DEFAULT_CARBON_USD_PER_T
    return {
      usd5: Math.round(tonnes5 * carbonPrice),
      usd100: Math.round(tonnes100 * carbonPrice),
      tonnes5,
      tonnes100,
      scale,
    }
  }, [stats, carbonPrice])

  if (loadError && !stats) {
    return (
      <div className="p-12 text-center space-y-3" role="alert">
        <p className="text-red-400">Could not load dashboard stats.</p>
        <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold">Retry</button>
      </div>
    )
  }
  if (!stats) return <div className="p-12 text-center text-gray-400" role="status">Loading command dashboard…</div>

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Stranded Command Dashboard</h1>
      <p className="text-gray-400 mb-8">Live KPIs · auto-synced {new Date(stats.generatedAt).toLocaleString()}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Sites', value: stats.siteCount.toLocaleString(), color: '#FF8C00' },
          { label: 'Provinces', value: String(stats.provinceCount), color: '#5BC0BE' },
          { label: 'Daily Methane', value: `${(stats.totals.emissionKgDay / 1000).toFixed(0)}k kg`, color: '#A78BFA' },
          { label: 'Live BTC', value: `$${btc.toLocaleString()}`, color: '#FBBF24' },
          { label: 'Avg Score', value: String(stats.totals.avgStrandedScore), color: '#34D399' },
          { label: 'High Score Sites', value: String(stats.totals.highScoreSites), color: '#F472B6' },
          { label: '5% CO₂e/yr', value: `${(stats.impact.co2eAvoided5PctTonnes / 1000).toFixed(0)}k t`, color: '#5BC0BE' },
          { label: 'Model Revenue', value: `$${(stats.valueModel.annualRevenueUsd / 1e6).toFixed(0)}M`, color: '#FF8C00' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">{k.label}</div>
            <div className="text-2xl font-bold mt-1 tabular-nums" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#34D399]/25 bg-[#34D399]/5 p-5 mb-8">
        <h2 className="font-semibold mb-2 text-[#34D399]">Carbon Credit Scenario</h2>
        <label className="text-xs text-gray-400">
          Price per tonne CO₂e: <span className="font-mono text-white">${carbonPrice}</span>/t
        </label>
        <input
          type="range"
          min={5}
          max={120}
          step={1}
          value={carbonPrice}
          onChange={e => setCarbonPrice(+e.target.value)}
          className="w-full max-w-md accent-[#34D399] mt-2"
        />
        {carbonTotals && (
          <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
            <div className="rounded-xl border border-white/10 p-4 bg-black/20">
              <div className="text-[10px] uppercase text-gray-500">5% capture portfolio</div>
              <div className="text-xl font-bold text-[#34D399] tabular-nums">${carbonTotals.usd5.toLocaleString()}/yr</div>
              <div className="text-xs text-gray-500">{carbonTotals.tonnes5.toLocaleString()} t CO₂e</div>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-black/20">
              <div className="text-[10px] uppercase text-gray-500">100% theoretical max</div>
              <div className="text-xl font-bold text-[#5BC0BE] tabular-nums">${carbonTotals.usd100.toLocaleString()}/yr</div>
              <div className="text-xs text-gray-500">{carbonTotals.tonnes100.toLocaleString()} t CO₂e</div>
            </div>
          </div>
        )}
        <p className="text-[10px] text-gray-500 mt-3">Illustrative only — not a market quote. Default baseline ${DEFAULT_CARBON_USD_PER_T}/t.</p>
      </div>

      <div className="rounded-2xl border border-white/10 p-5 mb-6">
        <h2 className="font-semibold mb-4">Top Movers <span className="text-[10px] font-normal text-gray-500">(simulated WoW %)</span></h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {stats.provinces.slice(0, 4).map((p, i) => {
            const simulatedPct = [12.4, 8.1, -3.2, 5.7][i] ?? ((p.pct % 17) - 4)
            return (
              <div key={p.name} className="rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                <div className="text-xs text-gray-400 truncate">{p.name}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold tabular-nums">{p.count}</span>
                  <span className={`text-xs font-mono ${simulatedPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {simulatedPct >= 0 ? '+' : ''}{simulatedPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-gray-500 mt-3">Illustrative momentum labels for demo dashboards — not live market data.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold mb-4">Top Provinces</h2>
          {stats.provinces.slice(0, 6).map(p => (
            <Link key={p.name} href={`/provinces?name=${encodeURIComponent(p.name)}`} className="flex justify-between py-2 border-b border-white/5 hover:text-[#FF8C00] text-sm">
              <span>{p.name}</span><span className="text-gray-400">{p.count} ({p.pct}%)</span>
            </Link>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link href="/map" className="p-3 rounded-xl bg-[#FF8C00]/10 border border-[#FF8C00]/30 text-center hover:bg-[#FF8C00]/20">Map</Link>
            <Link href="/pitch" className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10">Pitch</Link>
            <Link href="/funding" className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10">Funding</Link>
            <Link href="/docs/api" className="p-3 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10">API Docs</Link>
          </div>
        </div>
      </div>
    </div>
  )
}