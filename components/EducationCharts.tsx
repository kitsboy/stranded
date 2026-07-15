'use client'

import Link from 'next/link'

type ProvinceRow = { name: string; pct: number; emission: number }
type SourceRow = { type: string; pct: number }

type Props = {
  provinceData: ProvinceRow[]
  sourceData: SourceRow[]
  liveBtc: number
}

export default function EducationCharts({ provinceData, sourceData, liveBtc }: Props) {
  return (
    <div className="mb-16 grid md:grid-cols-2 gap-6">
      <div className="glass p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">Emissions by Province (click to explore value)</h3>
        <div className="space-y-3">
          {provinceData.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { window.location.href = `/map?province=${encodeURIComponent(p.name)}` }}
              className="w-full text-left flex items-center gap-3 hover:bg-white/5 p-1 rounded transition"
            >
              <div className="w-24 text-sm">{p.name}</div>
              <div className="flex-1 bg-white/10 h-3 rounded-full overflow-hidden">
                <div className="h-3 rounded-full" style={{ width: `${p.pct}%`, backgroundColor: '#FF8C00' }} />
              </div>
              <div className="w-12 text-right text-sm font-mono">{p.pct}%</div>
              <div className="text-[10px] text-emerald-400">~{(p.emission * 0.0009 * 365 * (liveBtc / 85000)).toFixed(0)} BTC/yr potential</div>
            </button>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-gray-500">Click any bar → opens the live map filtered to that province with full Value modeling.</div>
      </div>

      <div className="glass p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">Source Type Breakdown (Stranded Value potential)</h3>
        <div className="space-y-3">
          {sourceData.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-36 text-sm">{s.type}</div>
              <div className="flex-1 bg-white/10 h-3 rounded-full overflow-hidden">
                <div className="h-3 rounded-full bg-[#f59e0b]" style={{ width: `${s.pct}%` }} />
              </div>
              <div className="w-10 text-right text-sm font-mono">{s.pct}%</div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-xs text-gray-400">
          Industrial facilities and wellheads dominate the Stranded Value opportunity in Canada — see{' '}
          <Link href="/map" className="text-[#5BC0BE] hover:underline">live map</Link>.
        </div>
      </div>
    </div>
  )
}