import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import GlossaryTip from '@/components/GlossaryTip'
import MethodologyCalculator from '@/components/MethodologyCalculator'

export const metadata = {
  title: 'Methodology — Stranded Value',
  description: 'How Stranded Score™, ROI models, and ECCC data are computed.',
}

export default function MethodologyPage() {
  return (
    <div className="page-container prose prose-invert">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />
      <h1 className="text-4xl font-bold tracking-tighter not-prose">Methodology</h1>
      <p className="text-gray-400 not-prose mb-8">Transparent scoring, data lineage, and ROI assumptions.</p>

      <h2>Data source</h2>
      <p>All 2,611 sites come from <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer">ECCC verified methane reporting</a>. Stats regenerate on every build via <code>generate-live-stats.js</code>.</p>

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