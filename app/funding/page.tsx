'use client'

import { useState } from 'react'
import Link from 'next/link'

const CETA_PROGRAMS = [
  { id: 'cleantech', name: 'CETA Cleantech SME', max: 5000000, match: 0.5, provinces: ['All'] },
  { id: 'methane', name: 'Methane Reduction Fund', max: 10000000, match: 0.25, provinces: ['AB', 'SK', 'BC'] },
  { id: 'indigenous', name: 'Indigenous Clean Energy', max: 3000000, match: 0.75, provinces: ['All'] },
  { id: 'provincial-ab', name: 'Alberta Emissions Reduction', max: 8000000, match: 0.3, provinces: ['AB'] },
  { id: 'provincial-on', name: 'Ontario Low-Carbon Fund', max: 6000000, match: 0.35, provinces: ['ON'] },
]

export default function FundingPage() {
  const [province, setProvince] = useState('Alberta')
  const [capex, setCapex] = useState(2000000)
  const [sites, setSites] = useState(3)

  const eligible = CETA_PROGRAMS.filter(p =>
    p.provinces.includes('All') || p.provinces.some(pr => province.startsWith(pr) || province.includes(pr))
  )

  const totalGrant = eligible.reduce((sum, p) => sum + Math.min(capex * p.match, p.max), 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">CETA Funding Pathway</h1>
      <p className="text-gray-400 mb-8">Interactive wizard for Canadian-EU trade agreement aligned cleantech capital. Estimates only — verify with program officers.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="funding-province" className="text-xs text-gray-400">Province</label>
            <select id="funding-province" value={province} onChange={e => setProvince(e.target.value)} className="w-full mt-1 bg-black/30 border border-white/15 rounded-lg px-4 py-2.5">
              {['Alberta', 'Ontario', 'British Columbia', 'Saskatchewan', 'Quebec', 'Manitoba'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="funding-capex" className="text-xs text-gray-400">Total CapEx (CAD): ${capex.toLocaleString()}</label>
            <input id="funding-capex" type="range" min={500000} max={20000000} step={100000} value={capex} onChange={e => setCapex(+e.target.value)} className="w-full accent-[#FF8C00] mt-2" />
          </div>
          <div>
            <label htmlFor="funding-sites" className="text-xs text-gray-400">Sites in portfolio: {sites}</label>
            <input id="funding-sites" type="range" min={1} max={20} value={sites} onChange={e => setSites(+e.target.value)} className="w-full accent-[#5BC0BE] mt-2" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-6">
          <div className="text-sm text-gray-400 mb-1">Estimated grant stack</div>
          <div className="text-4xl font-bold text-[#FF8C00]">${Math.round(totalGrant).toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-2">{eligible.length} programs matched · {sites} sites</div>
          <div className="mt-4 space-y-2">
            {eligible.map(p => (
              <div key={p.id} className="flex justify-between text-xs">
                <span className="text-gray-300">{p.name}</span>
                <span className="text-[#5BC0BE]">up to ${(p.max / 1e6).toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/pitch" className="px-6 py-3 rounded-xl bg-[#FF8C00] text-black font-semibold">View Pitch Deck →</Link>
        <Link href="/Marketing-Hub.html" className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5">Roadmap & Funding Docs</Link>
      </div>
    </div>
  )
}