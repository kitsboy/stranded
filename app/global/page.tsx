import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import GlobalKpiCards from '@/components/GlobalKpiCards'
import { Globe } from 'lucide-react'

export const metadata = {
  title: 'Global Expansion — Stranded',
  description: 'Teaser for US flares, Australian sites, and international methane capture.',
}

const REGIONS = [
  {
    name: 'United States',
    flag: '🇺🇸',
    sites: '~1.4M flaring points',
    methane: 'EPA GHGRP + satellite flare catalogs',
    status: 'Research',
    color: '#60A5FA',
    note: 'Permian & Bakken vent/flare density rivals Canadian oil sands opportunity.',
  },
  {
    name: 'Australia',
    flag: '🇦🇺',
    sites: 'Coal mine vents + LNG',
    methane: 'NGER + state EPA reporting',
    status: 'Queued',
    color: '#34D399',
    note: 'Bowen Basin coal mine methane — similar mobile genset + mining stack.',
  },
  {
    name: 'European Union',
    flag: '🇪🇺',
    sites: 'Landfill gas + biogas',
    methane: 'EEA methane inventory',
    status: 'Concept',
    color: '#A78BFA',
    note: 'Landfill capture mandates create curtailment-style spill for flexible load.',
  },
  {
    name: 'Latin America',
    flag: '🌎',
    sites: 'Oilfield flares (Vaca Muerta, etc.)',
    methane: 'National oil company reports',
    status: 'Concept',
    color: '#FF8C00',
    note: 'Stranded flare gas with weak pipeline economics — Bitcoin offtaker fit.',
  },
]

export default function GlobalPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Global' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2 flex items-center gap-2">
        <Globe className="text-[#5BC0BE]" /> Global Expansion
      </h1>
      <p className="text-gray-400 mb-4">Canada first — international methane maps on the roadmap.</p>
      <GlobalKpiCards />
      <div className="grid sm:grid-cols-2 gap-4">
        {REGIONS.map(r => (
          <div
            key={r.name}
            className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition"
            style={{ borderColor: `${r.color}33` }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{r.flag}</span>
                <div className="font-semibold" style={{ color: r.color }}>{r.name}</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full border border-white/15 text-gray-400">{r.status}</span>
            </div>
            <div className="text-sm text-gray-400 mb-1">{r.sites}</div>
            <div className="text-xs text-gray-500 mb-3">Source: {r.methane}</div>
            <p className="text-xs text-gray-300 leading-relaxed">{r.note}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-gray-500">
        Partner inquiries: <Link href="/partnerships" className="text-[#FF8C00]">/partnerships</Link>
        {' · '}
        <Link href="/roadmap" className="text-[#5BC0BE] hover:underline">Roadmap</Link>
      </p>
    </div>
  )
}