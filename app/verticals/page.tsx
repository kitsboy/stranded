'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ENERGY_VERTICALS } from '@/lib/verticals'
import { OFFICIAL_PLANT_COUNT, OFFICIAL_PLANT_COUNTS, OFFICIAL_REMOTE_COUNT, OFFICIAL_REMOTE_COUNTS } from '@/lib/energy-build'
import { NETWORK_DERIVED_BTC_PER_TH_DAY, NETWORK_ESTIMATE_BTC_PER_TH_DAY } from '@/lib/fleet-model'
import { emissionTierItems } from '@/lib/dashboard-metrics'
import { useBtcPrice } from '@/components/BtcPriceProvider'
import type { LiveStats } from '@/types/live-stats'

const VERTICAL_SOURCE_MAP: Record<string, string[]> = {
  methane: [],
  wind: ['power_generation'],
  solar: ['power_generation'],
  'waste-heat': ['pulp_paper', 'refinery', 'industrial_other'],
  biomass: ['landfill_waste', 'pulp_paper'],
  hydro: ['power_generation'],
  'nuclear-smr': ['power_generation'],
}

const VERTICAL_PROVINCES: Record<string, string[]> = {
  wind: ['Alberta', 'Saskatchewan'],
  solar: ['Ontario', 'British Columbia'],
  'waste-heat': ['Alberta', 'Ontario', 'British Columbia'],
  biomass: ['Ontario', 'Quebec', 'Alberta'],
  hydro: ['British Columbia', 'Quebec', 'Manitoba'],
  'nuclear-smr': ['Ontario', 'New Brunswick', 'Saskatchewan', 'Alberta'],
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
  const { fiats } = useBtcPrice()
  const cadPerBtc = fiats.cad || 115000

  // Upgrades #31, #33, #34: Interactive Nuclear SMR & Grid Frequency-Response Simulator
  const [smrUnits, setSmrUnits] = useState<number>(2)
  const [offPeakHoursDay, setOffPeakHoursDay] = useState<number>(10)
  const [gridFreqCreditCadMwh, setGridFreqCreditCadMwh] = useState<number>(24)
  const [remoteMicrogridsDeployed, setRemoteMicrogridsDeployed] = useState<number>(35)

  const smrSim = useMemo(() => {
    const mwPerSmr = 300
    const computeAllocationRatio = 0.25 // 25% of SMR capacity allocated to interruptible compute
    const activeMw = smrUnits * mwPerSmr * computeAllocationRatio
    const miners = Math.floor((activeMw * 1_000_000) / 4050) // S21 XP 4050W
    const totalThs = miners * 300
    const dutyFactor = offPeakHoursDay / 24
    const annualBtcLive = totalThs * NETWORK_DERIVED_BTC_PER_TH_DAY * 0.95 * dutyFactor * 365
    const annualBtcOpt = totalThs * NETWORK_ESTIMATE_BTC_PER_TH_DAY * 0.95 * dutyFactor * 365
    const annualGridAncillaryCad = Math.round(activeMw * (24 - offPeakHoursDay) * 365 * gridFreqCreditCadMwh * 0.35)
    const remoteDieselSavedLitresYr = remoteMicrogridsDeployed * 420_000
    return {
      activeMw,
      miners,
      annualBtcLive: +annualBtcLive.toFixed(1),
      annualBtcOpt: +annualBtcOpt.toFixed(1),
      annualPensionBtcOpt: +(annualBtcOpt * 0.10).toFixed(1),
      annualGridAncillaryCad,
      remoteDieselSavedLitresYr,
    }
  }, [smrUnits, offPeakHoursDay, gridFreqCreditCadMwh, remoteMicrogridsDeployed])

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
        Methane is live today: 2,611 ECCC sites, with generator ROI. The official plant file adds {OFFICIAL_PLANT_COUNT.toLocaleString()} renewable plants (mostly August 2017) and {OFFICIAL_REMOTE_COUNT.toLocaleString()} remote communities (2025). A miner build on those pins uses recorded power only. The older counts on the cards below are separate claims. They are not that plant file.
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
                <p className="text-xs text-gray-300 mb-3">Official plant file: {OFFICIAL_PLANT_COUNTS.biomass.toLocaleString()} biomass plants. Statistics Canada publishes 2025 biomass generation and no 2025 biomass capacity, so those plants are not given a miner payback. The {v.potentialSites.toLocaleString()} figure is a separate roadmap claim, not that file.</p>
              )}
              {v.id === 'waste-heat' && (
                <p className="text-xs text-gray-300 mb-3">No official waste-heat site file is on the map. The {v.potentialSites.toLocaleString()} figure is a beta claim, not a pin count.</p>
              )}
              {v.id === 'nuclear-smr' && (
                <p className="text-xs text-gray-300 mb-3">Phase 3 sovereign horizon: pairs off-peak CANDU surplus &amp; future Small Modular Reactors (ON, NB, SK, AB) with interruptible Bitcoin ASIC compute. Methane is our live, verified lead story today.</p>
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

      <section className="mt-10 rounded-3xl border border-[#A78BFA]/35 bg-gradient-to-br from-[#A78BFA]/10 via-[#0f172a] to-[#5BC0BE]/10 p-6 md:p-8" data-testid="nuclear-smr-simulator">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#A78BFA]/40 bg-[#A78BFA]/15 px-3 py-1 text-xs font-semibold tracking-wider text-[#A78BFA]">
              ⚛️ PHASE 3 HORIZON SIMULATOR · NUCLEAR SMR + GRID FREQUENCY RESPONSE + 143 REMOTE COMMUNITIES
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Phase 3: CANDU &amp; Small Modular Reactor (SMR) Interruptible Baseload + Remote Diesel Displacement
            </h2>
            <p className="mt-1 text-sm text-gray-300 max-w-3xl">
              Methane is our verified Lead Story today (2,611 ECCC sites). Once the Sovereign Bitcoin Pension rail is live, Phase 3 pairs 300 MW BWRX-300 / CANDU SMRs in Ontario, New Brunswick, Saskatchewan, and Alberta with millisecond-interruptible ASIC loads and displaces diesel across 143 fossil-dependent remote communities.
            </p>
          </div>
          <Link href="/map" className="rounded-xl border border-[#A78BFA]/50 bg-[#A78BFA]/15 px-4 py-2 text-xs font-semibold text-[#A78BFA] hover:bg-[#A78BFA]/25 transition">
            Open Nuclear SMR Corridor on Map →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-black/30 rounded-2xl p-4 border border-white/10 mb-5 text-xs">
          <div>
            <label className="flex justify-between text-gray-300 mb-1">
              <span>300 MW SMR Units Online</span>
              <span className="font-mono font-bold text-[#A78BFA]">{smrUnits} × 300 MW</span>
            </label>
            <input type="range" min={1} max={12} step={1} value={smrUnits} onChange={e => setSmrUnits(Number(e.target.value))} aria-label="Number of 300 MW SMR units" className="w-full accent-[#A78BFA]" />
            <div className="text-[11px] text-gray-400 mt-1">25% ({smrSim.activeMw} MW) behind-the-meter ASIC buffer</div>
          </div>

          <div>
            <label className="flex justify-between text-gray-300 mb-1">
              <span>Off-Peak Surplus Hours / Day</span>
              <span className="font-mono font-bold text-[#5BC0BE]">{offPeakHoursDay}h / 24h</span>
            </label>
            <input type="range" min={4} max={24} step={1} value={offPeakHoursDay} onChange={e => setOffPeakHoursDay(Number(e.target.value))} aria-label="Off-peak surplus hours per day" className="w-full accent-[#5BC0BE]" />
            <div className="text-[11px] text-gray-400 mt-1">Drops to 0 MW in &lt;100ms during peak grid demand</div>
          </div>

          <div>
            <label className="flex justify-between text-gray-300 mb-1">
              <span>IESO/AESO Frequency Credit</span>
              <span className="font-mono font-bold text-[#34D399]">C${gridFreqCreditCadMwh}/MWh</span>
            </label>
            <input type="range" min={0} max={60} step={2} value={gridFreqCreditCadMwh} onChange={e => setGridFreqCreditCadMwh(Number(e.target.value))} aria-label="Grid frequency response credit per MWh" className="w-full accent-[#34D399]" />
            <div className="text-[11px] text-gray-400 mt-1">Ancillary demand-response revenue</div>
          </div>

          <div>
            <label className="flex justify-between text-gray-300 mb-1">
              <span>Remote Diesel Microgrids</span>
              <span className="font-mono font-bold text-[#FF8C00]">{remoteMicrogridsDeployed} / 143</span>
            </label>
            <input type="range" min={5} max={143} step={1} value={remoteMicrogridsDeployed} onChange={e => setRemoteMicrogridsDeployed(Number(e.target.value))} aria-label="Remote diesel microgrids converted" className="w-full accent-[#FF8C00]" />
            <div className="text-[11px] text-gray-400 mt-1">Of 143 NRCan fossil remote communities</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-2xl border border-[#A78BFA]/30 bg-black/25 p-4">
            <div className="text-[10px] uppercase text-[#A78BFA] font-semibold">Interruptible SMR Fleet</div>
            <div className="mt-1 text-2xl font-bold font-mono text-white">{smrSim.miners.toLocaleString()} ASICs</div>
            <div className="mt-1 text-gray-400">{smrSim.activeMw} MW instant load-following buffer</div>
          </div>
          <div className="rounded-2xl border border-[#34D399]/30 bg-black/25 p-4">
            <div className="text-[10px] uppercase text-[#34D399] font-semibold">Annual SMR BTC Yield</div>
            <div className="mt-1 text-2xl font-bold font-mono text-white">{smrSim.annualBtcLive} / {smrSim.annualBtcOpt} BTC</div>
            <div className="mt-1 text-gray-400">Live Network vs. Optimistic · +{smrSim.annualPensionBtcOpt} BTC/yr to Pension</div>
          </div>
          <div className="rounded-2xl border border-[#5BC0BE]/30 bg-black/25 p-4">
            <div className="text-[10px] uppercase text-[#5BC0BE] font-semibold">Grid Ancillary Credit</div>
            <div className="mt-1 text-2xl font-bold font-mono text-white">C${(smrSim.annualGridAncillaryCad / 1e6).toFixed(2)}M/yr</div>
            <div className="mt-1 text-gray-400">Paid for millisecond curtailment during peak hours (${Math.round(cadPerBtc).toLocaleString()} CAD/BTC ref)</div>
          </div>
          <div className="rounded-2xl border border-[#FF8C00]/30 bg-black/25 p-4">
            <div className="text-[10px] uppercase text-[#FF8C00] font-semibold">Remote Diesel Displaced</div>
            <div className="mt-1 text-2xl font-bold font-mono text-white">{(smrSim.remoteDieselSavedLitresYr / 1e6).toFixed(1)}M L/yr</div>
            <div className="mt-1 text-gray-400">Across {remoteMicrogridsDeployed} remote communities</div>
          </div>
        </div>
      </section>

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