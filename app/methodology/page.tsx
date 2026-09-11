import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import GlossaryTip from '@/components/GlossaryTip'
import MethodologyCalculator from '@/components/MethodologyCalculator'
import MethodologyLiveBanner from '@/components/MethodologyLiveBanner'

export const metadata = {
  title: 'Methodology — Stranded Value',
  description: 'How Stranded Score™, ROI models, and ECCC data are computed.',
}

export default function MethodologyPage() {
  return (
    <div className="page-container prose prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />
      <h1 className="text-4xl font-bold tracking-tighter not-prose">Methodology</h1>
      <p className="text-gray-400 not-prose mb-4">Transparent scoring, data lineage, and ROI assumptions.</p>

      <MethodologyLiveBanner />

      <h2>Data source</h2>
      <p>All 2,611 sites are <em>mapped</em> from <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer">ECCC open methane reporting</a>: 2,588 carry a reported CH₄ figure and 675 are high-confidence and emission-bearing. We only use the word &quot;verified&quot; for that high-confidence set, never the whole file. Stats regenerate on every build via <code>generate-live-stats.js</code>.</p>

      <h2>Stranded Score™ v3</h2>
      <p>Log-scaled emission is the primary driver. When ECCC does not publish grid distance or internet type, we infer proxies from source category (landfill, oil &amp; gas, power, etc.), province infrastructure, emission tier, data confidence, and reporting year. Scores span ~22–96 with meaningful elite (≥85) and high (≥65) tiers. Percentile badges compare each site to the full Canadian dataset.</p>
      <div className="not-prose flex flex-wrap gap-2 my-4">
        <span className="stranded-score score-elite">≥85 Elite</span>
        <span className="stranded-score score-high">≥65 High</span>
        <span className="stranded-score score-med">≥45 Medium</span>
        <span className="stranded-score score-low">&lt;45 Low</span>
      </div>
      <p className="text-sm text-gray-400">Map markers and badges use the same thresholds everywhere (home, sites browser, command palette, map).</p>

      <MethodologyCalculator />

      <h2>ROI model</h2>
      <p>Advanced ROI applies H₂S derate, seasonal uptime by province, gas treatment, carbon credits, CETA-style incentives, fleet decline, and halving-adjusted BTC revenue. See <Link href="/education">Education</Link> for genset specs. Site panel shows a sensitivity tornado and peer cohort when available.</p>

      <h2 id="hashprice">Hashprice — two honest ends</h2>
      <p>Daily mining revenue is driven by <em>hashprice</em>: what 1 TH/s earns per day. We show both ends instead of claiming one.</p>
      <div className="not-prose grid gap-3 my-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#FF8C00]/25 bg-[#FF8C00]/5 p-4">
          <div className="text-label uppercase tracking-widest text-[#FF8C00]">App default · optimistic scenario</div>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">0.0000009 BTC / TH / day</div>
          <p className="text-xs text-gray-400 mt-2">Editable in the site panel. Roughly <strong>2.2×</strong> the network-derived figure — every payback that relies on it is an optimistic scenario, labelled as such in the panel, education page and all exports.</p>
        </div>
        <div className="rounded-2xl border border-[#34D399]/30 bg-[#34D399]/5 p-4">
          <div className="text-label uppercase tracking-widest text-[#34D399]">Network-derived reference</div>
          <div className="text-2xl font-bold text-white tabular-nums mt-1">≈ 0.00000041 BTC / TH / day</div>
          <p className="text-xs text-gray-400 mt-2">Derived live from the two editable inputs in the site panel: daily BTC issuance (≈450 BTC/day subsidy + fees) ÷ network hashrate (≈1.1 ZH/s). Moves with price and difficulty.</p>
        </div>
      </div>
      <p className="text-sm text-gray-400">Formula: <code>networkDerived = dailyBtcIssuance ÷ networkHashrate</code>. The numbers in the site panel recompute when you edit those two inputs; this page shows the shipped <code>@/lib/fleet-model.ts</code> defaults.</p>

      <h2>Bank packs</h2>
      <p>Export diligence packages from the map site panel, mission panel, or sites browser: Markdown brief (score factors + peers + sensitivity), CSV, Excel-friendly TSV, printable HTML, and JSON. No account required — files download locally.</p>

      <h2>Glossary (hover tips)</h2>
      <ul className="not-prose space-y-2 text-sm text-gray-300">
        <li><GlossaryTip term="Inferred field" /> — proxy when ECCC omits grid distance or internet type</li>
        <li><GlossaryTip term="Mission" /> — local portfolio of selected sites</li>
        <li><GlossaryTip term="LCOE" /> — levelized cost of energy for the genset CapEx model</li>
        <li><GlossaryTip term="Bank pack" /> — multi-format export for capital diligence</li>
        <li><GlossaryTip term="Stranded Score™" /> · <GlossaryTip term="Genset" /> · <GlossaryTip term="ASIC" /> · <GlossaryTip term="CH₄" /></li>
      </ul>

      <h2>Updates</h2>
      <p>Live metrics: <Link href="/data/live-stats.json">live-stats.json</Link> · API docs: <Link href="/docs/api">/docs/api</Link> · Status: <Link href="/status">/status</Link> · <Link href="/open-data">Open Data</Link> · <Link href="/roadmap">Roadmap</Link> · <Link href="/privacy">Privacy</Link></p>
    </div>
  )
}