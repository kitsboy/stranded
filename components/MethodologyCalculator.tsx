'use client'

import { useMemo, useState } from 'react'
import { computeStrandedScore } from '@/lib/scoring'
import { scoreTierClass } from '@/lib/scoring'

export default function MethodologyCalculator() {
  const [emission, setEmission] = useState(5000)
  const [gridKm, setGridKm] = useState(18)
  const [internet, setInternet] = useState<'fiber' | 'lte' | 'none'>('lte')
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium')
  const [sourceType, setSourceType] = useState('landfill_waste')
  const [province, setProvince] = useState('Alberta')

  const score = useMemo(() => computeStrandedScore({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
      name: 'Interactive sample',
      province,
      source_type: sourceType,
      emission_rate_kg_day: emission,
      distance_to_grid_km: gridKm,
      internet_type: internet,
      confidence,
      reference_year: 2024,
    },
  }), [emission, gridKm, internet, confidence, sourceType, province])

  return (
    <div className="not-prose rounded-2xl border border-white/10 bg-white/[0.03] p-6 my-8">
      <h2 className="text-xl font-semibold text-[#FF8C00] mb-1">Interactive Score Calculator</h2>
      <p className="text-sm text-gray-400 mb-6">Adjust inputs to see Stranded Score™ v3 respond in real time (client-side only).</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4 text-sm">
          <div>
            <label className="text-xs text-gray-400">Emission rate: {emission.toLocaleString()} kg/day</label>
            <input type="range" min={50} max={60000} step={50} value={emission} onChange={e => setEmission(+e.target.value)} className="w-full accent-[#FF8C00] mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Grid distance: {gridKm} km</label>
            <input type="range" min={3} max={80} value={gridKm} onChange={e => setGridKm(+e.target.value)} className="w-full accent-[#5BC0BE] mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Internet type</label>
            <select value={internet} onChange={e => setInternet(e.target.value as typeof internet)} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
              <option value="fiber">Fiber</option>
              <option value="lte">LTE / cable</option>
              <option value="none">None / remote</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Confidence</label>
            <select value={confidence} onChange={e => setConfidence(e.target.value as typeof confidence)} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Source type</label>
            <select value={sourceType} onChange={e => setSourceType(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
              <option value="landfill_waste">Landfill / waste</option>
              <option value="oil_gas_extraction">Oil &amp; gas extraction</option>
              <option value="power_generation">Power generation</option>
              <option value="coal_mining">Coal mining</option>
              <option value="industrial_other">Industrial other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">Province</label>
            <select value={province} onChange={e => setProvince(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm">
              {['Alberta', 'Ontario', 'British Columbia', 'Quebec', 'Saskatchewan', 'Manitoba', 'Nova Scotia', 'Nunavut'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-8">
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Estimated Score</div>
          <div className={`stranded-score text-4xl px-4 py-2 ${scoreTierClass(score)}`}>{score}</div>
          <p className="text-[10px] text-gray-500 mt-4 text-center max-w-xs">
            Uses the same v3 formula as the map. Omitting grid/internet triggers inferred proxies — here you supply explicit values.
          </p>
        </div>
      </div>
    </div>
  )
}