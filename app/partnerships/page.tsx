'use client'

import { Suspense, useEffect, useState } from 'react'
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
            <div className="text-label uppercase tracking-wider text-gray-400">Verified portfolio (live-stats)</div>
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
              <div><div className="text-xl font-bold text-white">{r.sites}</div><div className="text-label text-gray-400">sites</div></div>
              <div><div className="text-xl font-bold text-[#FF8C00]">{r.potentialMw} MW</div><div className="text-label text-gray-400">potential</div></div>
              <div><div className="text-xl font-bold text-white">{r.communities}</div><div className="text-label text-gray-400">communities</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#FF8C00]/30 bg-gradient-to-r from-[#FF8C00]/10 to-transparent p-6 mb-10">
        <h2 className="text-lg font-semibold text-[#FF8C00] mb-2">Miner, Operator &amp; Engineering Contact</h2>
        <p className="text-sm text-gray-300 mb-4 max-w-2xl">
          Deploying mobile Bitcoin mining on Nation lands or remote methane sites? Connect with Stranded Value (<strong className="text-white">hello@giveabit.io</strong> &amp; <strong className="text-[#5BC0BE]">kimi@giveabit.io</strong>) for site shortlists,
          partnership MOU templates, open engineering roles, and ASIC sourcing via Tadbuy.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:hello@giveabit.io?cc=kimi@giveabit.io&subject=Stranded%20Energy%20%E2%80%94%20Capital%20or%20partnership" className="px-5 py-2.5 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold hover:bg-[#FF8C00]/90">
            Email hello@giveabit.io (CC kimi@giveabit.io) →
          </a>
          <Link href="/map" className="px-5 py-2.5 rounded-xl border border-[#5BC0BE]/40 text-[#5BC0BE] text-sm hover:bg-[#5BC0BE]/10">
            Build a mission on the map
          </Link>
          <a href="https://tadbuy.giveabit.io?ref=stranded&ctx=partnerships" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl border border-white/20 text-sm hover:bg-white/5">
            ASICs via Tadbuy
          </a>
        </div>
      </div>

      {/* Intelligent Job Postings & Field Engineering Roles */}
      <div className="mb-12 rounded-2xl border border-[#5BC0BE]/30 bg-gradient-to-br from-[#0f172a] via-[#111c2d] to-[#0b111f] p-6 md:p-8" data-testid="partnerships-job-board">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#5BC0BE]/35 bg-[#5BC0BE]/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#5BC0BE]">
              CAREERS &amp; FIELD ENGINEERING · DIRECT TO KIMI &amp; HELLO@GIVEABIT.IO
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Open Roles: Build Canada&apos;s Stranded Energy &amp; Bitcoin Infrastructure
            </h2>
            <p className="mt-1 text-sm text-gray-300 max-w-3xl">
              Every 850 kW–10.5 MW stranded methane capture cluster creates high-skill Canadian and CETA/EU engineering roles. Click any role below to pre-fill the application form or email <strong className="text-white">hello@giveabit.io</strong> (CC <strong className="text-[#5BC0BE]">kimi@giveabit.io</strong>) directly.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-xs">
          {[
            {
              title: 'Field Genset & Reciprocating Engine Technician',
              loc: 'Alberta · BC · Ontario (Field / Rotational)',
              comp: 'Competitive Base + Site Profit-Share',
              desc: 'Commission and maintain INNIO Jenbacher J316, Cat G3520H, and Cummins QSK60G prime gas engines on off-grid flare/vent pads.',
            },
            {
              title: 'Containerized ASIC & Capture Hut Electrical Lead',
              loc: 'Edmonton · Calgary · Windsor · Remote',
              comp: 'Competitive Base + BTC Performance Bonus',
              desc: 'Oversee 480V/600V CSA switchgear, Arctic air/hydro Capture Huts, Starlink telemetry, and 95%+ fleet uptime.',
            },
            {
              title: 'Gas Conditioning & H₂S / Siloxane Scrubber Engineer',
              loc: 'Western Canada & Municipal Landfills',
              comp: 'Project Contract or Full-Time',
              desc: 'Size and operate knockout chillers, iron-sponge H₂S scrubbers, and landfill siloxane filtration skids.',
            },
            {
              title: 'EU / CETA Grant & Project Finance Structuring Lead',
              loc: 'Remote (Canada / EU Hybrid)',
              comp: 'Base + Success Fee on Non-Dilutive Capital',
              desc: 'Lead Two-SPV project finance packages, Horizon Europe Cluster 5 consortia, ERA/CleanBC filings, and 30% Clean Tech ITC claims.',
            },
            {
              title: 'First Nations & Landowner Partnerships Director',
              loc: 'Treaty 6, 7, 8 & Northern BC / SK / ON',
              comp: 'Base + Cluster Origination Share',
              desc: 'Structure 15–30% Indigenous equity/royalty co-ownership and AIOC / CIB loan-guarantee packages across 742 overlapping sites.',
            },
            {
              title: 'Full-Stack Geospatial & Bitcoin Telemetry Engineer',
              loc: 'Remote (Global / Global Talent Stream 2-Week Visa)',
              comp: 'Competitive Fiat or Bitcoin Denominated',
              desc: 'Advance the Stranded Value Command Center, OpenTimestamps pin proofs, and live ASIC/genset SCADA dashboards.',
            },
          ].map(job => (
            <div key={job.title} className="rounded-2xl border border-white/10 bg-black/30 p-4 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-white text-sm mb-1">{job.title}</div>
                <div className="text-[11px] text-[#5BC0BE] mb-2">{job.loc} · <span className="text-[#FF8C00]">{job.comp}</span></div>
                <p className="text-gray-300 leading-relaxed mb-3">{job.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                <Link
                  href={`/partnerships?category=${encodeURIComponent('Job posting')}&site=${encodeURIComponent(job.title)}#lead-name`}
                  className="flex-1 text-center rounded-lg bg-[#FF8C00] px-3 py-1.5 font-semibold text-black hover:bg-[#ff9d33] transition"
                >
                  Apply via Form ↓
                </Link>
                <a
                  href={`mailto:hello@giveabit.io?cc=kimi@giveabit.io&subject=${encodeURIComponent(`Stranded Energy — Job posting: ${job.title}`)}`}
                  className="rounded-lg border border-[#5BC0BE]/40 px-3 py-1.5 text-[#5BC0BE] hover:bg-[#5BC0BE]/10 transition"
                >
                  Email Kimi &amp; Team
                </a>
              </div>
            </div>
          ))}
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
        <Suspense fallback={<div className="text-sm text-gray-400">Loading application form…</div>}>
          <CertifiedLeadForm />
        </Suspense>
      </div>
    </div>
  )
}