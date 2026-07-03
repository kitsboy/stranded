'use client'

import Link from 'next/link'
import CertifiedLeadForm from '@/components/CertifiedLeadForm'

const FN_REGIONS = [
  { name: 'Treaty 6 & 8 (Alberta)', sites: 412, potentialMw: 340, communities: 24 },
  { name: 'Northern BC', sites: 89, potentialMw: 120, communities: 18 },
  { name: 'Saskatchewan First Nations', sites: 156, potentialMw: 95, communities: 12 },
  { name: 'Northern Ontario', sites: 67, potentialMw: 55, communities: 15 },
  { name: 'Nunavut & NWT', sites: 18, potentialMw: 28, communities: 8 },
]

export default function PartnershipsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">First Nations & Community Partnerships</h1>
      <p className="text-gray-400 mb-10 max-w-2xl">
        Stranded methane sites overlap significantly with Indigenous territories. Revenue-sharing, remediation funding, and sovereign wealth creation are core to Stranded Value — not an afterthought.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {FN_REGIONS.map(r => (
          <div key={r.name} className="rounded-2xl border border-[#5BC0BE]/25 bg-[#5BC0BE]/5 p-5">
            <div className="font-semibold text-[#5BC0BE]">{r.name}</div>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center text-sm">
              <div><div className="text-xl font-bold text-white">{r.sites}</div><div className="text-[10px] text-gray-500">sites</div></div>
              <div><div className="text-xl font-bold text-[#FF8C00]">{r.potentialMw} MW</div><div className="text-[10px] text-gray-500">potential</div></div>
              <div><div className="text-xl font-bold text-white">{r.communities}</div><div className="text-[10px] text-gray-500">communities</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Partnership Model</h2>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>→ Revenue share: 15–30% to landholder / Nation</li>
            <li>→ Remediation-first: methane capture before mining scale-up</li>
            <li>→ Local jobs: install + ops FTEs per site cluster</li>
            <li>→ Data sovereignty: Nations control their site data views</li>
            <li>→ CETA Indigenous Clean Energy program alignment</li>
          </ul>
          <Link href="/funding" className="inline-block mt-6 text-[#5BC0BE] hover:underline">Explore funding pathways →</Link>
        </div>
        <CertifiedLeadForm />
      </div>
    </div>
  )
}