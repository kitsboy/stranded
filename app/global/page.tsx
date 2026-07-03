import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Globe } from 'lucide-react'

export const metadata = {
  title: 'Global Expansion — Stranded',
  description: 'Teaser for US flares, Australian sites, and international methane capture.',
}

const REGIONS = [
  { name: 'United States', sites: '~1.4M flaring points', status: 'Research' },
  { name: 'Australia', sites: 'Coal mine vents', status: 'Queued' },
  { name: 'EU Landfills', sites: 'Landfill gas', status: 'Concept' },
]

export default function GlobalPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Global' }]} />
      <h1 className="text-4xl font-bold tracking-tighter mb-2 flex items-center gap-2">
        <Globe className="text-[#5BC0BE]" /> Global Expansion
      </h1>
      <p className="text-gray-400 mb-8">Canada first — international methane maps on the roadmap.</p>
      <div className="grid gap-4">
        {REGIONS.map(r => (
          <div key={r.name} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex justify-between items-center">
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm text-gray-500">{r.sites}</div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full border border-white/15 text-gray-400">{r.status}</span>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-gray-500">
        Partner inquiries: <Link href="/partnerships" className="text-[#FF8C00]">/partnerships</Link>
      </p>
    </div>
  )
}