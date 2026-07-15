'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { LiveStats } from '@/types/live-stats'

const ASIC_EFFICIENCY = [
  { model: 'Antminer S21 XP', hashrate: '300 TH/s', power: '4050 W', efficiency: '13.5 J/TH', vendor: 'Bitmain' },
  { model: 'Antminer S21', hashrate: '200 TH/s', power: '3500 W', efficiency: '17.5 J/TH', vendor: 'Bitmain' },
  { model: 'WhatsMiner M60S', hashrate: '186 TH/s', power: '3348 W', efficiency: '18.0 J/TH', vendor: 'MicroBT' },
  { model: 'Antminer T21', hashrate: '190 TH/s', power: '3610 W', efficiency: '19.0 J/TH', vendor: 'Bitmain' },
  { model: 'WhatsMiner M50S++', hashrate: '150 TH/s', power: '3276 W', efficiency: '21.8 J/TH', vendor: 'MicroBT' },
  { model: 'Antminer S19 XP', hashrate: '140 TH/s', power: '3010 W', efficiency: '21.5 J/TH', vendor: 'Bitmain' },
  { model: 'Antminer S19k Pro', hashrate: '136 TH/s', power: '3264 W', efficiency: '24.0 J/TH', vendor: 'Bitmain' },
  { model: 'Antminer S19a Pro', hashrate: '110 TH/s', power: '3250 W', efficiency: '29.5 J/TH', vendor: 'Bitmain' },
  { model: 'WhatsMiner M30S++', hashrate: '112 TH/s', power: '3472 W', efficiency: '31.0 J/TH', vendor: 'MicroBT' },
  { model: 'Antminer S19', hashrate: '95 TH/s', power: '3250 W', efficiency: '34.2 J/TH', vendor: 'Bitmain' },
]

export default function BenchmarksPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loadMs, setLoadMs] = useState<number | null>(null)

  useEffect(() => {
    const t0 = performance.now()
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then(j => { setStats(j); setLoadMs(Math.round(performance.now() - t0)) })
  }, [])

  return (
    <div className="page-container page-container--wide">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Benchmarks' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Performance Benchmarks</h1>
      <p className="text-gray-400 mb-8">Static export targets — measured on this device.</p>

      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {[
          { label: 'live-stats.json fetch', value: loadMs != null ? `${loadMs} ms` : '…' },
          { label: 'Build routes', value: stats ? '16+ static pages' : '…' },
          { label: 'Dataset size', value: stats ? `${stats.siteCount} sites` : '…' },
          { label: 'Version', value: stats?.version || '…' },
          { label: 'PWA cache', value: 'Service worker v3 + IndexedDB' },
          { label: 'Map render mode', value: 'Native cluster @ 180+ pins' },
        ].map(row => (
          <div key={row.label} className="p-4 rounded-xl border border-white/10">
            <div className="text-[10px] uppercase text-gray-500">{row.label}</div>
            <div className="text-xl font-mono mt-1 text-[#5BC0BE]">{row.value}</div>
          </div>
        ))}
      </div>

      {stats?.topSites?.length ? (
        <>
          <h2 className="text-xl font-semibold mb-4 text-[#FF8C00]">Top Sites (live-stats)</h2>
          <p className="text-sm text-gray-400 mb-4">Highest Stranded Score™ sites from prebuild snapshot — compare against your filter results.</p>
          <div className="overflow-x-auto rounded-xl border border-white/10 mb-10" data-testid="benchmarks-top-sites">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
                  <th className="p-3">#</th>
                  <th className="p-3">Site</th>
                  <th className="p-3">Province</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3 text-right">kg/day</th>
                  <th className="p-3">Genset</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSites.slice(0, 10).map((s, i) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 text-gray-500">{i + 1}</td>
                    <td className="p-3">
                      <Link href={`/map?site=${s.id}`} className="font-medium hover:text-[#FF8C00]">
                        {s.name}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-400">{s.province}</td>
                    <td className="p-3 text-right font-mono text-[#FF8C00]">{s.score}</td>
                    <td className="p-3 text-right font-mono text-[#5BC0BE]">{s.emissionKgDay.toLocaleString()}</td>
                    <td className="p-3 text-xs text-gray-500">{s.genset}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <h2 className="text-xl font-semibold mb-4 text-[#FF8C00]">ASIC Efficiency Reference</h2>
      <p className="text-sm text-gray-400 mb-4">Models used in site panel ROI — lower J/TH is better at fixed power budget.</p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-gray-500">
              <th className="p-3">Model</th>
              <th className="p-3">Hashrate</th>
              <th className="p-3">Power</th>
              <th className="p-3">Efficiency</th>
              <th className="p-3">Vendor</th>
            </tr>
          </thead>
          <tbody>
            {ASIC_EFFICIENCY.map(row => (
              <tr key={row.model} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-3 font-medium">{row.model}</td>
                <td className="p-3 font-mono text-xs text-[#5BC0BE]">{row.hashrate}</td>
                <td className="p-3 font-mono text-xs">{row.power}</td>
                <td className="p-3 font-mono text-xs text-[#FF8C00]">{row.efficiency}</td>
                <td className="p-3 text-xs text-gray-500">{row.vendor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}