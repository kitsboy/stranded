'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Rocket } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { scoreTierClass } from '@/lib/scoring'
import { useBtcUsd } from '@/components/BtcPriceProvider'
import JsonLd from '@/components/JsonLd'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'
import CountUp from '@/components/CountUp'
import SectionDivider from '@/components/SectionDivider'
import { useReducedMotion } from '@/lib/useReducedMotion'

type FeaturedSite = { id?: string; name: string; province: string; emission: number; score: number; link: string }

export default function LandingPage() {
  const { locale, t } = useLocale()
  const btc = useBtcUsd()
  const reducedMotion = useReducedMotion()
  const [featured, setFeatured] = useState<FeaturedSite[]>([])
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then((s: LiveStats) => {
        setStats(s)
        setFeatured(s.topSites.slice(0, 3).map(t => ({
          id: t.id,
          name: t.name,
          province: t.province,
          emission: t.emissionKgDay,
          score: t.score,
          link: `/map?site=${t.id}`,
        })))
      })
      .catch(() => {})
  }, [])

  const siteCount = stats?.siteCount ?? 2611
  const provinceCount = stats?.provinceCount ?? 13
  const avgScore = stats?.totals?.avgStrandedScore
  const highScore = stats?.totals?.highScoreSites

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Stranded Value',
        url: 'https://stranded.giveabit.io',
        description: `${siteCount.toLocaleString()} verified stranded methane sites across Canada with Bitcoin-powered ROI modeling`,
        publisher: { '@type': 'Organization', name: 'GiveAbit Intelligence', url: 'https://giveabit.io' },
      },
      {
        '@type': 'Dataset',
        name: 'Stranded Canadian Methane Sites',
        description: 'ECCC-verified methane vent sites enriched with Stranded Score™ and generator recommendations',
        url: 'https://stranded.giveabit.io/data/stranded-sites.geojson',
        distribution: { '@type': 'DataDownload', contentUrl: 'https://stranded.giveabit.io/data/stranded-sites.geojson', encodingFormat: 'application/geo+json' },
        creator: { '@type': 'Organization', name: 'Environment and Climate Change Canada' },
        numberOfItems: siteCount,
      },
    ],
  }

  const HeroBadge = reducedMotion ? 'div' : motion.div
  const heroBadgeProps = reducedMotion
    ? { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] text-xs tracking-widest mb-6 border border-[#FF8C00]/20' }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
        className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF8C00]/10 text-[#FF8C00] text-xs tracking-widest mb-6 border border-[#FF8C00]/20',
      }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--bg-dark)] text-white overflow-x-hidden">
      <JsonLd data={homeJsonLd} />
      {/* Hero */}
      <div className="hero-mesh max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <HeroBadge {...heroBadgeProps}>
          {t('heroBadge')}
        </HeroBadge>

        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
          {t('heroTitle1')}<br />
          <span className="text-[#FF8C00]">{t('heroTitle2')}</span>
        </h1>
        <p className="max-w-2xl mx-auto text-2xl text-gray-300 mb-10">
          {tf(locale, 'heroSubtitle', { count: siteCount.toLocaleString() })}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/map"
            prefetch
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-[#1e293b] font-semibold text-lg transition"
          >
            {t('heroExploreMap')}
          </Link>
          <Link href="/pitch" prefetch className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-[#FF8C00]/50 text-[#FF8C00] hover:bg-[#FF8C00]/10 text-lg transition">
            {t('heroLivePitch')}
          </Link>
          <Link href="/sites" className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-white/30 hover:bg-white/5 text-lg transition">
            {tf(locale, 'heroBrowseSites', { count: siteCount.toLocaleString() })}
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-500">{t('heroDataNote')}</p>
      </div>

      {/* Stats */}
      <div className="border-y border-white/10 bg-black/20">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          <div>
            <div className="text-4xl font-semibold text-[#FF8C00] tabular-nums">
              <CountUp value={siteCount} />
            </div>
            <div className="text-sm text-gray-400 mt-1">{t('statVerifiedSites')}</div>
          </div>
          <div>
            <div className="text-4xl font-semibold text-[#FF8C00] tabular-nums">
              <CountUp value={provinceCount} />
            </div>
            <div className="text-sm text-gray-400 mt-1">{t('statProvinces')}</div>
          </div>
          <div>
            <div className="text-4xl font-semibold text-[#FF8C00] tabular-nums">
              {avgScore != null ? <CountUp value={avgScore} decimals={1} /> : '—'}
            </div>
            <div className="text-sm text-gray-400 mt-1">{t('statAvgScore')}{highScore != null ? ` · ${highScore} ≥80` : ''}</div>
          </div>
          <div>
            <div className="text-4xl font-semibold text-[#FF8C00] tabular-nums">
              <CountUp value={0} />
            </div>
            <div className="text-sm text-gray-400 mt-1">{t('statGridImpact')}</div>
          </div>
          <div>
            <div className="text-4xl font-semibold tabular-nums text-emerald-400">
              <CountUp value={btc} prefix="$" />
            </div>
            <div className="text-sm text-gray-400 mt-1">{t('statLiveBtc')}</div>
          </div>
        </div>
      </div>

      {/* Opportunity */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#5BC0BE]">The Problem</h2>
            <p className="text-gray-300 leading-relaxed">
              Stranded methane is natural gas that is uneconomical to capture and transport through pipelines.
              It is routinely vented or flared, releasing methane — a greenhouse gas 25× more potent than CO₂.
            </p>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Canada has thousands of these sites. The data is public. The technology exists today.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#5BC0BE]">The Opportunity</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex gap-3"><span className="text-[#FF8C00]">→</span> Reduce methane emissions at source</li>
              <li className="flex gap-3"><span className="text-[#FF8C00]">→</span> Generate Bitcoin using otherwise wasted energy</li>
              <li className="flex gap-3"><span className="text-[#FF8C00]">→</span> Create new revenue for site owners & remediation</li>
              <li className="flex gap-3"><span className="text-[#FF8C00]">→</span> Zero additional load on the electrical grid</li>
            </ul>
            <div className="mt-6">
              <Link href="/education" className="text-[#5BC0BE] hover:underline">Learn more in Education →</Link>
            </div>
          </div>
        </div>
      </div>

      <SectionDivider label="Featured" />

      {/* Featured Opportunities */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Featured Opportunities</h2>
            <p className="text-gray-400 text-sm">Top sites by Stranded Score • Highest potential impact</p>
          </div>
          <Link href="/sites" className="text-sm link-animated">See all →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {(featured.length ? featured : [{ name: 'Loading top sites…', province: '', emission: 0, score: 0, link: '/map' }]).map((site, i) => (
            <Link key={site.id || i} href={site.link} className="glass glass-card-lift p-5 rounded-2xl border border-white/10 block">
              <div className="flex justify-between gap-2">
                <div className="font-semibold truncate">{site.name}</div>
                {site.score > 0 && <div className={`stranded-score text-xs ${scoreTierClass(site.score)}`}>{site.score}</div>}
              </div>
              <div className="text-sm text-gray-400 mt-1">{site.province} • {site.emission.toLocaleString()} kg/day • Live from dataset</div>
              <div className="text-xs text-[#5BC0BE] mt-3">View on map → (real CapEx + ROI with gensets)</div>
            </Link>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-3 text-center">Capturing these alone could avoid thousands of tonnes CO₂e annually while generating significant Bitcoin.</p>
      </div>

      {/* How Stranded Value Works - Clear Business Flow */}
      <div className="max-w-5xl mx-auto px-6 py-12 border-t border-white/10">
        <div className="text-center mb-10">
          <div className="text-[#FF8C00] text-xs tracking-[3px]">THE STRANDED VALUE FLOW</div>
          <h2 className="text-3xl font-semibold tracking-tighter mt-1">From Data to Deployed Capital in 4 Steps</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { num: "01", title: "Discover", desc: "Explore 2,611 real sites on the live map with filters, scores, and generator recommendations.", cta: "Open Map", href: "/map" },
            { num: "02", title: "Learn Value", desc: "Dive into the Education Center: simulators, real machines, per-site ROI with CapEx & financing.", cta: "Start Learning", href: "/education" },
            { num: "03", title: "Build Mission", desc: "Select sites, model with real generators + ASICs, simulate portfolio returns and methane value created.", cta: "Build Portfolio", href: "/map" },
            { num: "04", title: "Fund & Deploy", desc: "Download docs from the Marketing Hub, connect to CETA/Canadian capital, or contact us to activate.", cta: "Get the Hub", href: "/Marketing-Hub.html" },
          ].map((step, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-white/10 flex flex-col">
              <div className="text-4xl font-bold text-[#FF8C00]/80 mb-3">{step.num}</div>
              <div className="font-semibold text-lg mb-2">{step.title}</div>
              <p className="text-sm text-gray-300 flex-1">{step.desc}</p>
              <Link href={step.href} className="btn-secondary mt-4 text-sm">{step.cta} →</Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">Every step uses live data from the 2,611-site dataset for honest, bankable Stranded Value.</p>
      </div>

      {/* Choose Your Path - Persona Driven Business Flow */}
      <div className="max-w-5xl mx-auto px-6 py-12 border-t border-white/10">
        <div className="text-center mb-8">
          <div className="text-[#FF8C00] text-xs tracking-[3px]">TAILORED FOR YOU</div>
          <h2 className="text-3xl font-semibold tracking-tighter mt-1">Stranded Value for Every Stakeholder</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: "⚙️", title: "For Operators & Miners", desc: "Source sites, model real generator + ASIC economics, deploy fast with zero grid impact.", cta: "Explore Sites", href: "/sites" },
            { icon: "💰", title: "For Capital Providers", desc: "Transparent per-site ROI, generator CapEx, financed paybacks, methane value created. De-risked opportunities.", cta: "See the Data", href: "/map" },
            { icon: "🏛️", title: "For Government & Provinces", desc: "Regional impact dashboards, CETA alignment, job creation, CO₂e avoided at scale. Policy intelligence.", cta: "View by Province", href: "/map" },
            { icon: "🤝", title: "For Landowners & Communities", desc: "Real revenue potential from your land, remediation funding, First Nations wealth creation.", cta: "Calculate Your Value", href: "/education" },
          ].map((p, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-white/10 hover:border-[#FF8C00]/30 transition">
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="font-semibold mb-2">{p.title}</div>
              <p className="text-sm text-gray-300 mb-4">{p.desc}</p>
              <Link href={p.href} className="text-sm text-[#5BC0BE] hover:underline">{p.cta} →</Link>
            </div>
          ))}
        </div>
      </div>

      {/* The Beautiful Flywheel */}
      <div className="bg-[#0f172a] border-y border-white/10 py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-[#FF8C00] text-xs tracking-[3px]">THE ELEGANT LOOP</div>
              <h3 className="text-4xl font-bold tracking-tighter mt-1">Methane becomes energy.<br />Energy becomes Bitcoin.<br />Bitcoin becomes planetary healing.</h3>
              <p className="mt-4 text-gray-300 max-w-md">The most elegant climate + capital flywheel available today. One offtaker that actually works for stranded resources.</p>
            </div>
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image src="/images/5.jpg" alt="Energy to Bitcoin Flywheel" width={800} height={500} loading="lazy" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* Mini live impact calculator */}
      <div className="max-w-3xl mx-auto px-6 py-14 text-center border-b border-white/10">
        <div className="text-[#FF8C00] text-xs tracking-[3px] mb-1">FEEL WHAT SMALL NUMBERS CAN DO</div>
        <h3 className="text-3xl font-bold tracking-tighter mb-6">What if we captured just 5%?</h3>
        <input type="range" min="1" max="25" defaultValue="5" className="w-full max-w-md accent-[#FF8C00]" onChange={(e)=>{
          const v = parseInt(e.target.value);
          const n = siteCount;
          const co2e = stats?.impact?.co2eAvoided5PctTonnes
            ? Math.round(stats.impact.co2eAvoided5PctTonnes * (v / 5))
            : Math.round(v * 1240 * 365 * 25 / 1000);
          const el = document.getElementById('quick-impact');
          if (el) el.innerText = `~${Math.round(n * v / 100).toLocaleString()} sites • ~${co2e.toLocaleString()} t CO₂e avoided/yr • serious sats`;
        }} />
        <div id="quick-impact" className="mt-4 text-2xl font-mono text-[#FF8C00]">
          ~{Math.round(siteCount * 0.05).toLocaleString()} sites • ~{(stats?.impact?.co2eAvoided5PctTonnes ?? 1049340).toLocaleString()} t CO₂e avoided/yr • serious sats
        </div>
        <p className="text-xs text-gray-500 mt-1">This is only 5%. The full {siteCount.toLocaleString()} is 20× more powerful.</p>
      </div>

      {/* Voices from the Frontier */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <div className="text-[#FF8C00] text-xs tracking-[3px]">FROM THE PEOPLE BUILDING IT</div>
          <h3 className="text-3xl font-bold tracking-tighter mt-1">Voices from the frontier</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            "“For the first time the economics actually work without subsidies.” — Western Canada energy leader",
            "“The data was always there. Someone finally made it feel alive and urgent.” — Climate tech founder, Toronto",
            "“This isn’t theory for our communities. It’s new revenue from something that used to cost us.” — Northern Alberta landholder",
          ].map((q,i) => <div key={i} className="glass p-6 rounded-3xl text-sm border border-white/10">{q}</div>)}
        </div>
      </div>

      {/* The Vision */}
      <div className="max-w-4xl mx-auto px-6 text-center py-14 border-t border-white/10">
        <div className="mx-auto mb-5 w-11 h-11 rounded-full bg-[#FF8C00]/10 flex items-center justify-center"><Rocket className="text-[#FF8C00]" /></div>
        <h2 className="text-5xl font-bold tracking-tighter leading-none mb-4">This is what fixing the world looks like.</h2>
        <p className="text-xl text-gray-300 max-w-lg mx-auto">Not another tax. Not another rule. Just the hardest money ever invented, quietly eating one of the dirtiest problems on Earth — one small, profitable, beautiful site at a time.</p>
      </div>

      {/* In-page CTAs (scroll with content). Mobile sticky Open Map / Pitch live in Footer — not a second fixed layer. */}
      <div className="max-w-6xl mx-auto px-6 pb-16 text-center">
        <div className="text-xs tracking-[3px] text-[#FF8C00] mb-3">THE DATA IS OPEN. THE TOOLS ARE READY.</div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/map" className="px-9 py-4 rounded-2xl bg-[#FF8C00] text-[#0b111f] font-semibold text-lg hover:bg-[#ff9d33] active:scale-[0.985] touch-manipulation">Open the Live Command Center</Link>
          <Link href="/education" className="px-8 py-4 rounded-2xl border border-white/30 hover:bg-white/5 text-lg touch-manipulation">Dive deeper in the Education Center</Link>
        </div>
        <p className="mt-4 text-xs text-gray-500 tracking-widest">EVERYTHING IS VERIFIABLE • ⌘K ANYWHERE TO SEARCH THE 2,611</p>
        <p className="mt-6 text-[10px] text-gray-500">
          Full professional marketing suite available in the <a href="/Marketing-Hub.html" className="underline hover:text-[#FF8C00]">Marketing Hub</a> (includes all 5 documents + visuals)
        </p>
      </div>
    </div>
  )
}
