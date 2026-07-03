'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { LiveStats } from '@/types/live-stats'

export default function DashboardPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [btc, setBtc] = useState(85000)

  useEffect(() => {
    const refresh = () => {
      fetch('/data/live-stats.json').then(r => r.json()).then(setStats)
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        .then(r => r.json()).then(j => j?.bitcoin?.usd && setBtc(j.bitcoin.usd))
    }
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!stats) return <div className="p-12 text-center text-gray-400">Loading command dashboard…</div>

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