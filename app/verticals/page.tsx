'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ENERGY_VERTICALS } from '@/lib/verticals'
import { OFFICIAL_PLANT_COUNT, OFFICIAL_PLANT_COUNTS, OFFICIAL_REMOTE_COUNT, OFFICIAL_REMOTE_COUNTS } from '@/lib/energy-build'
import { emissionTierItems } from '@/lib/dashboard-metrics'
import type { LiveStats } from '@/types/live-stats'

const VERTICAL_SOURCE_MAP: Record<string, string[]> = {
  methane: [],
  wind: ['power_generation'],
  solar: ['power_generation'],
  'waste-heat': ['pulp_paper', 'refinery', 'industrial_other'],
  biomass: ['landfill_waste', 'pulp_paper'],
  hydro: ['power_generation'],
}

const VERTICAL_PROVINCES: Record<string, string[]> = {
  wind: ['Alberta', 'Saskatchewan'],
  solar: ['Ontario', 'British Columbia'],
  'waste-heat': ['Alberta', 'Ontario', 'British Columbia'],
  biomass: ['Ontario', 'Quebec', 'Alberta'],
  hydro: ['British Columbia', 'Quebec', 'Manitoba'],
}

function provinceCards(stats: LiveStats, provinces: string[]) {
  return stats.provinces
    .filter(p => provinces.includes(p.name))
    .map(p => ({
      name: p.name,
      sites: p.count,
      emissionKgDay: p.emissionKgDay ?? 0,
    }))
}

export default function VerticalsPage() {
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const methaneTiers = useMemo(
    () => (stats ? emissionTierItems(stats) : []),
    [stats],
  )

  const featured = ENERGY_VERTICALS.filter(v => v.section)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Energy Verticals</h1>
      <p className="text-gray-400 mb-10">
        Methane is live today: 2,611 ECCC sites, with generator ROI. The official plant file adds {OFFICIAL_PLANT_COUNT.toLocaleString()} renewable plants (mostly August 2017) and {OFFICIAL_REMOTE_COUNT.toLocaleString()} remote communities (2018). A miner build on those pins uses recorded power only. The older counts on the cards below are separate claims. They are not that plant file.
        {stats && (
          <span className="text-gray-400"> · Live dataset v{stats.version} · {stats.siteCount.toLocaleString()} sites</span>
        )}
      </p>

      {featured.map(v => v.section && (
        <section key={v.id} className="mb-10 rounded-2xl border p-6" style={{ borderColor: `${v.color}44`, background: `${v.color}08` }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{v.icon}</span>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: v.color }}>{v.section.headline}</h2>
              <span className="text-label uppercase px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">{v.status}</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-300 mb-4">
            {v.section.bullets.map(b => (
              <li key={b} className="flex gap-2"><span className="text-[#FF8C00]">→</span>{b}</li>
            ))}
          </ul>
          {v.section.mapHint && (
            <p className="text-xs text-gray-400">{v.section.mapHint} · <Link href="/map" className="text-[#5BC0BE] hover:underline">Open map</Link></p>
          )}
        </section>
      ))}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ENERGY_VERTICALS.map(v => {
          const sourceKeys = VERTICAL_SOURCE_MAP[v.id] ?? []
          const sourceCount = stats && sourceKeys.length
            ? stats.sourceTypes
                .filter(s => sourceKeys.includes(s.name))
                .reduce((sum, s) => sum + s.count, 0)
            : null
          const provinceData = stats && VERTICAL_PROVINCES[v.id]
            ? provinceCards(stats, VERTICAL_PROVINCES[v.id])
            : []

          return (
            <div
              key={v.id}
              data-testid={`vertical-card-${v.id}`}
              className="rounded-2xl border border-white/10 p-6 hover:border-white/25 transition"
              style={{ borderColor: `${v.color}33` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{v.icon}</span>
                <div>
                  <div className="font-semibold" style={{ color: v.color }}>{v.name}</div>
                  <span className={`text-label uppercase px-2 py-0.5 rounded-full ${v.status === 'live' ? 'bg-green-500/20 text-green-400' : v.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{v.status}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">{v.description}</p>
              {v.id === 'wind' && (
                <p className="text-xs text-gray-300 mb-3">Official plant file: {OFFICIAL_PLANT_COUNTS.wind.toLocaleString()} wind plants. The {v.potentialSites.toLocaleString()} figure on this card is a beta curtailment claim, not that file, and not unused power.</p>
              )}
              {v.id === 'solar' && (
                <p className="text-xs text-gray-300 mb-3">Official plant file: {OFFICIAL_PLANT_COUNTS.solar.toLocaleString()} solar plants. The {v.potentialSites.toLocaleString()} figure is a separate beta claim, not that file.</p>
              )}
              {v.id === 'hydro' && (
                <p className="text-xs text-gray-300 mb-3">Official plant file: {OFFICIAL_PLANT_COUNTS.hydro.toLocaleString()} hydro plants. The {v.potentialSites.toLocaleString()} hydro-spill figure is a separate roadmap claim, not that file. A miner build uses nameplate times the province capacity factor. It is not spare spill.</p>
              )}
              {v.id === 'biomass' && (
                <p className="text-xs text-gray-300 mb-3">Official plant file: {OFFICIAL_PLANT_COUNTS.biomass.toLocaleString()} biomass plants. Statistics Canada publishes 2025 biomass generation and no 2024 biomass capacity, so those plants are not given a miner payback. The {v.potentialSites.toLocaleString()} figure is a separate roadmap claim, not that file.</p>
              )}
              {v.id === 'waste-heat' && (
                <p className="text-xs text-gray-300 mb-3">No official waste-heat site file is on the map. The {v.potentialSites.toLocaleString()} figure is a beta claim, not a pin count.</p>
              )}

              {v.id === 'methane' && methaneTiers.length > 0 && (
                <div className="text-xs space-y-1.5 mb-4 rounded-xl border border-[#FF8C00]/20 bg-[#FF8C00]/5 p-3">
                  <div className="text-label uppercase tracking-wider text-[#FF8C00]">Emission tiers (live)</div>
                  {methaneTiers.slice(0, 4).map(t => (
                    <div key={t.key} className="flex justify-between text-gray-300">
                      <span>{t.label}</span>
                      <span className="tabular-nums">{t.count.toLocaleString()} <span className="text-gray-400">({t.pct}%)</span></span>
                    </div>
                  ))}
                </div>
              )}

              {v.id !== 'methane' && provinceData.length > 0 && (
                <div className="text-xs space-y-1.5 mb-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-label uppercase tracking-wider text-gray-400">Province proxy (live methane map)</div>
                  {provinceData.map(p => (
                    <div key={p.name} className="flex justify-between text-gray-300">
                      <span>{p.name}</span>
                      <span className="tabular-nums">{p.sites} sites</span>
                    </div>
                  ))}
                </div>
              )}

              {sourceCount != null && sourceCount > 0 && (
                <div className="text-xs text-gray-400 mb-2">
                  ~{sourceCount.toLocaleString()} mapped source-type sites in dataset
                </div>
              )}

              <div className="text-xs space-y-1 text-gray-400">
                <div>~{v.potentialSites.toLocaleString()} potential sites</div>
                <div>Avg {v.avgPowerKw.toLocaleString()} kW</div>
                <div className="text-gray-300">{v.btcFit}</div>
              </div>
              {v.status === 'live' && <Link href="/map" className="inline-block mt-4 text-sm text-[#5BC0BE] hover:underline">Open live map →</Link>}
            </div>
          )
        })}
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 p-6" data-testid="official-energy-counts">
        <h2 className="text-xl font-semibold mb-2">Official files on the map</h2>
        <p className="text-sm text-gray-400 mb-4">
          These counts are the shipped plant and remote files. Geothermal plants in that file: {OFFICIAL_PLANT_COUNTS.geothermal}. Tidal: {OFFICIAL_PLANT_COUNTS.tidal}. Pumped storage: {OFFICIAL_PLANT_COUNTS.pumped}. Other renewable: {OFFICIAL_PLANT_COUNTS.other}. Remote diesel, oil, or gas: {OFFICIAL_REMOTE_COUNTS['remote-fossil']}. Remote hydro: {OFFICIAL_REMOTE_COUNTS['remote-hydro']}. Already on a grid: {OFFICIAL_REMOTE_COUNTS['remote-grid']}. Source not stated: {OFFICIAL_REMOTE_COUNTS['remote-unknown']}.
        </p>
        <p className="text-sm text-gray-400">
          Infrastructure points, province shades, solar images, and hydrokinetic polygons are on the map and are not miner sites. The hydrokinetic file does not publish kilowatts.
        </p>
      </section>
    </div>
  )
}