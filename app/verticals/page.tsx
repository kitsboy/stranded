'use client'

import Link from 'next/link'
import { ENERGY_VERTICALS } from '@/lib/verticals'

export default function VerticalsPage() {
  const featured = ENERGY_VERTICALS.filter(v => v.section)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">Energy Verticals</h1>
      <p className="text-gray-400 mb-10">Methane is live today. Wind, solar, waste heat, biomass, and hydro spill are expanding the Stranded Value ecosystem.</p>

      {featured.map(v => v.section && (
        <section key={v.id} className="mb-10 rounded-2xl border p-6" style={{ borderColor: `${v.color}44`, background: `${v.color}08` }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{v.icon}</span>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: v.color }}>{v.section.headline}</h2>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">{v.status}</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-300 mb-4">
            {v.section.bullets.map(b => (
              <li key={b} className="flex gap-2"><span className="text-[#FF8C00]">→</span>{b}</li>
            ))}
          </ul>
          {v.section.mapHint && (
            <p className="text-xs text-gray-500">{v.section.mapHint} · <Link href="/map" className="text-[#5BC0BE] hover:underline">Open map</Link></p>
          )}
        </section>
      ))}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ENERGY_VERTICALS.map(v => (
          <div key={v.id} className="rounded-2xl border border-white/10 p-6 hover:border-white/25 transition" style={{ borderColor: `${v.color}33` }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{v.icon}</span>
              <div>
                <div className="font-semibold" style={{ color: v.color }}>{v.name}</div>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${v.status === 'live' ? 'bg-green-500/20 text-green-400' : v.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{v.status}</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">{v.description}</p>
            <div className="text-xs space-y-1 text-gray-500">
              <div>~{v.potentialSites.toLocaleString()} potential sites</div>
              <div>Avg {v.avgPowerKw.toLocaleString()} kW</div>
              <div className="text-gray-300">{v.btcFit}</div>
            </div>
            {v.status === 'live' && <Link href="/map" className="inline-block mt-4 text-sm text-[#5BC0BE] hover:underline">Open live map →</Link>}
          </div>
        ))}
      </div>
    </div>
  )
}