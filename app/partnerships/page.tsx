'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CertifiedLeadForm from '@/components/CertifiedLeadForm'
import type { LiveStats } from '@/types/live-stats'

const FN_REGIONS = [
  { name: 'Treaty 6 & 8 (Alberta)', sites: 412, potentialMw: 340, communities: 24 },
  { name: 'Northern BC', sites: 89, potentialMw: 120, communities: 18 },
  { name: 'Saskatchewan First Nations', sites: 156, potentialMw: 95, communities: 12 },
  { name: 'Northern Ontario', sites: 67, potentialMw: 55, communities: 15 },
  { name: 'Nunavut & NWT', sites: 18, potentialMw: 28, communities: 8 },
]

export default function PartnershipsPage() {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLiveStats(data) })
      .catch(() => { /* optional */ })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold tracking-tighter mb-2">First Nations & Community Partnerships</h1>
      <p className="text-gray-400 mb-6 max-w-2xl">
        Stranded methane sites overlap significantly with Indigenous territories. Revenue-sharing, remediation funding, and sovereign wealth creation are core to Stranded Value — not an afterthought.
      </p>

      {liveStats && (
        <div
          className="mb-10 rounded-2xl border border-[#FF8C00]/30 bg-gradient-to-r from-[#FF8C00]/10 to-transparent p-6 flex flex-wrap items-center gap-6"
          data-testid="partnerships-hero-stat"
        >
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Verified portfolio (live-stats)</div>
            <div className="text-5xl font-bold text-[#FF8C00] tabular-nums">{liveStats.siteCount.toLocaleString('en-CA')}</div>
            <div className="text-sm text-gray-400">stranded methane sites · {liveStats.provinceCount} provinces</div>
          </div>
          <div className="text-sm text-gray-300 max-w-md">
            Every build refreshes site counts from ECCC GeoJSON. Nations can shortlist overlapping facilities on the map and export diligence packs.
          </div>
        </div>
      )}

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

      <div className="rounded-2xl border border-[#FF8C00]/30 bg-gradient-to-r from-[#FF8C00]/10 to-transparent p-6 mb-10">
        <h2 className="text-lg font-semibold text-[#FF8C00] mb-2">Miner & Operator Contact</h2>
        <p className="text-sm text-gray-300 mb-4 max-w-2xl">
          Deploying mobile Bitcoin mining on Nation lands or remote methane sites? Connect with Stranded Value for site shortlists,
          partnership MOU templates, and ASIC sourcing via Tadbuy.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:partnerships@giveabit.io?subject=Stranded%20miner%20partnership" className="px-5 py-2.5 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold hover:bg-[#FF8C00]/90">
            Email miner partnerships →
          </a>
          <Link href="/map" className="px-5 py-2.5 rounded-xl border border-[#5BC0BE]/40 text-[#5BC0BE] text-sm hover:bg-[#5BC0BE]/10">
            Build a mission on the map
          </Link>
          <a href="https://tadbuy.giveabit.io?ref=stranded&ctx=partnerships" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl border border-white/20 text-sm hover:bg-white/5">
            ASICs via Tadbuy
          </a>
        </div>
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